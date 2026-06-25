#include "pxt.h"

// neopixel.ts에 있는 네임스페이스 이름(vibeLamp)과 동일해야 합니다.
namespace vibeLamp {
    
    //%
    void sendBuffer(Buffer buf, int pin) {
        // V2의 내장 DMA(백그라운드 하드웨어 가속) 함수를 호출합니다.
        light::sendWS2812(pin, buf->data, buf->length);
    }
}
