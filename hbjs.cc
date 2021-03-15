#include "harfbuzz/src/harfbuzz.cc"

HB_BEGIN_DECLS

int
hbjs_glyph_svg (hb_font_t *font, hb_codepoint_t glyph, char *buf, unsigned buf_size);

unsigned
hbjs_shape_with_trace (hb_font_t *font, hb_buffer_t* buf,
                       char* featurestring,
                       unsigned int stop_at, unsigned int stop_phase,
                       char *outbuf, unsigned buf_size);

void *free_ptr(void);

HB_END_DECLS


void *free_ptr(void) { return (void *) free; }

enum {
  HB_SHAPE_DONT_STOP,
  HB_SHAPE_GSUB_PHASE,
  HB_SHAPE_GPOS_PHASE
};

struct user_data_t {
  user_data_t(char *str_,
              unsigned size_,
              unsigned stop_at_ = 0,
              unsigned stop_phase_ = 0)
    : str(str_)
    , size(size_)
    , stop_at(stop_at_)
    , stop_phase(stop_phase_)
  {}
  char *str = nullptr;
  unsigned size = 0;
  unsigned consumed = 0;
  hb_bool_t failure = false;
  unsigned stop_at = 0;
  unsigned stop_phase = 0;
  hb_bool_t stopping = false;
  unsigned current_phase = 0;
};


static void
_user_data_printf (user_data_t *data, const char *format, ...)
{
#define BUFSIZE 1000
  char buf[BUFSIZE];
  int len;
  va_list va;

  if (!data || data->failure)
    return;

  va_start(va, format);
  len = vsnprintf(buf, BUFSIZE, format, va);
  va_end(va);

  if (data->consumed + len >= data->size || len < 0 || len > BUFSIZE)
  {
      data->failure = true;
      return;
  }

  memcpy (data->str + data->consumed, buf, len);
  data->consumed += len;
#undef BUFSIZE
}

static void
move_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	 float to_x, float to_y,
	 void *)
{
  _user_data_printf (draw_data, "M%g,%g", (double)to_x, (double)to_y);
}

static void
line_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	 float to_x, float to_y,
	 void *)
{
  _user_data_printf (draw_data, "L%g,%g", (double)to_x, (double)to_y);
}

static void
quadratic_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	      float control_x, float control_y,
	      float to_x, float to_y,
	      void *)
{
  _user_data_printf (draw_data, "Q%g,%g %g,%g",
                     (double)control_x,
                     (double)control_y,
                     (double)to_x,
                     (double)to_y);
}

static void
cubic_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	  float control1_x, float control1_y,
	  float control2_x, float control2_y,
	  float to_x, float to_y,
	  void *)
{
  _user_data_printf (draw_data, "C%g,%g %g,%g %g,%g",
                     (double)control1_x,
                     (double)control1_y,
                     (double)control2_x,
                     (double)control2_y,
                     (double)to_x,
                     (double)to_y);
}

static void
close_path (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *, void *)
{
  _user_data_printf (draw_data, "Z");
}

static hb_draw_funcs_t *funcs = 0;

int
hbjs_glyph_svg (hb_font_t *font, hb_codepoint_t glyph, char *buf, unsigned buf_size)
{
  if (funcs == 0) /* not the best pattern for multi-threaded apps which is not a concern here */
  {
    funcs = hb_draw_funcs_create (); /* will be leaked */
    hb_draw_funcs_set_move_to_func (funcs, (hb_draw_move_to_func_t) move_to, nullptr, nullptr);
    hb_draw_funcs_set_line_to_func (funcs, (hb_draw_line_to_func_t) line_to, nullptr, nullptr);
    hb_draw_funcs_set_quadratic_to_func (funcs, (hb_draw_quadratic_to_func_t) quadratic_to, nullptr, nullptr);
    hb_draw_funcs_set_cubic_to_func (funcs, (hb_draw_cubic_to_func_t) cubic_to, nullptr, nullptr);
    hb_draw_funcs_set_close_path_func (funcs, (hb_draw_close_path_func_t) close_path, nullptr, nullptr);
  }

  user_data_t draw_data(buf, buf_size);
  hb_font_get_glyph_shape (font, glyph, funcs, &draw_data);
  if (draw_data.failure)
    return -1;

  buf[draw_data.consumed] = '\0';
  return draw_data.consumed;
}

static hb_bool_t do_trace (hb_buffer_t *buffer,
                           hb_font_t   *font,
                           const char  *message,
                           user_data_t *user_data) {
  unsigned int consumed;
  unsigned int num_glyphs = hb_buffer_get_length (buffer);

  if (strcmp(message, "start table GSUB") == 0) {
    user_data->current_phase = HB_SHAPE_GSUB_PHASE;
  } else if (strcmp(message, "start table GPOS") == 0) {
    user_data->current_phase = HB_SHAPE_GPOS_PHASE;
  }


  if (user_data->current_phase != user_data->stop_phase) {
    user_data->stopping = false;
  }

  // If we overflowed, keep going anyway.
  if (user_data->failure) return 1;

  if (user_data->stop_phase != HB_SHAPE_DONT_STOP) {
    // Do we need to start stopping?
    char buf[12];
    snprintf (buf, 12, "%d", user_data->stop_at);
    if ((user_data->current_phase == user_data->stop_phase) &&
        (strncmp(message, "end lookup ", 11) == 0) &&
        (strcmp(message + 11, buf) == 0)) {
      user_data->stopping = true;
    }
  }

  // If we need to stop, stop.
  if (user_data->stopping) return 0;

  _user_data_printf (user_data, "{\"m\":\"%s\",\"t\":", message);
  hb_buffer_serialize_glyphs(buffer, 0, num_glyphs,
    user_data->str + user_data->consumed,
    user_data->size - user_