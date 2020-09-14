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
  len = vsnprintf(buf, BUFSIZ