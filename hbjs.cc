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
close_path (hb_draw_funcs_t *df