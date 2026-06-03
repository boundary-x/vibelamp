/**
 * 네오픽셀 LED 색상 목록
 */
enum NeoPixelColors {
    //% block=빨간색(red)
    Red = 0xFF0000,
    //% block=주황색(orange)
    Orange = 0xFFA500,
    //% block=노란색(yellow)
    Yellow = 0xFFFF00,
    //% block=초록색(green)
    Green = 0x00FF00,
    //% block=파란색(blue)
    Blue = 0x0000FF,
    //% block=남색(indigo)
    Indigo = 0x000080,
    //% block=보라색(violet)
    Violet = 0x8a2be2,
    //% block=흰색(white)
    White = 0xFFFFFF,
    //% block=끄기
    Black = 0x000000
}

/**
 * 네오픽셀 연결 형식
 */
enum NeoPixelMode {
    //% block="RGB (GRB 형식)"
    RGB = 1,
    //% block="RGB+W"
    RGBW = 2,
    //% block="RGB (RGB 형식)"
    RGB_RGB = 3
}

/**
 * bit box 네오픽셀 LED 제어 블록
 */
//% weight=5 color=#58ACFA icon="\uf1b2" block="bit box"
namespace bitbox {
    //% shim=sendBufferAsm
    function sendBuffer(buf: Buffer, pin: DigitalPin) {
    }

    /**
     * 네오픽셀 스트립 객체
     */
    export class Strip {
        buffer: Buffer;
        pin: DigitalPin;
        brightness: number;  // 밝기 (0-255)
        start: number;       // LED 스트립 시작 오프셋
        _length: number;     // LED 개수
        mode: NeoPixelMode;
        matrixWidth: number;
        matrixChain: number;
        matrixRotation: number;

        // ======================== 빛박 제어(기초) ========================

        /**
         * 모든 LED를 지정한 색상으로 켭니다.
         * @param rgb LED 색상
         */
        //% blockId="bitbox_set_strip_color"
        //% block="%strip| 라이트를 모두 %rgb=bitbox_colors| 으로 켜기"
        //% strip.defl=strip
        //% group="빛박 제어(기초)"
        //% weight=70 blockGap=8
        showColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * 모든 LED를 끕니다.
         */
        //% blockId="bitbox_clear"
        //% block="%strip| 라이트 모두 끄기"
        //% strip.defl=strip
        //% group="빛박 제어(기초)"
        //% weight=60 blockGap=8
        clear(): void {
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buffer.fill(0, this.start * stride, this._length * stride);
            this.show();
        }

        /**
         * LED 스트립의 밝기를 설정합니다.
         * @param brightness 밝기 값 (0~255), eg: 128
         */
        //% blockId="bitbox_set_brightness"
        //% block="%strip| 라이트의 밝기를 %brightness 로 변경하기"
        //% strip.defl=strip
        //% brightness.min=0 brightness.max=255
        //% group="빛박 제어(기초)"
        //% weight=80 blockGap=8
        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * LED 스트립의 일부 범위를 선택합니다.
         * @param start 시작 위치
         * @param length LED 개수, eg: 8
         */
        //% blockId="bitbox_range"
        //% block="%strip| 의 %start| 번째부터 %length| 개의 라이트"
        //% strip.defl=strip
        //% length.defl=8
        //% group="빛박 제어(기초)"
        //% weight=90 blockGap=8
        //% blockSetVariable=range
        createRange(start: number, length: number): Strip {
            start = start >> 0;
            length = length >> 0;
            let strip = new Strip();
            strip.buffer = this.buffer;
            strip.pin = this.pin;
            strip.brightness = this.brightness;
            strip.start = this.start + Math.clamp(0, this._length - 1, start);
            strip._length = Math.clamp(0, this._length - (strip.start - this.start), length);
            strip.matrixWidth = 0;
            strip.mode = this.mode;
            return strip;
        }

        // ======================== 빛박 제어(심화) ========================

        /**
         * 설정한 내용을 LED 스트립에 표시합니다.
         */
        //% blockId="bitbox_show"
        //% block="%strip| 라이트를 설정한대로 켜기"
        //% strip.defl=strip
        //% group="빛박 제어(심화)"
        //% weight=80 blockGap=8
        show() {
            sendBuffer(this.buffer, this.pin);
        }

        /**
         * 특정 위치의 LED 색상을 설정합니다. (표시하려면 '설정한대로 켜기' 블록 필요)
         * @param pixelOffset LED 위치 번호
         * @param rgb LED 색상
         */
        //% blockId="bitbox_set_pixel_color"
        //% block="%strip| 의 %pixelOffset| 번째 라이트 색상을 %rgb=bitbox_colors 으로 설정하기"
        //% strip.defl=strip
        //% group="빛박 제어(심화)"
        //% weight=90 blockGap=8
        setPixelColor(pixelOffset: number, rgb: number): void {
            this.setPixelRGB(pixelOffset >> 0, rgb >> 0);
        }

        /**
         * 모든 LED에 무지개 패턴을 표시합니다.
         * @param startHue 시작 색조 값, eg: 1
         * @param endHue 끝 색조 값, eg: 360
         */
        //% blockId="bitbox_set_strip_rainbow"
        //% block="%strip| 라이트 무지개 효과 - 시작색: %startHue|, 종료색: %endHue"
        //% strip.defl=strip
        //% startHue.min=0 startHue.max=360
        //% endHue.min=0 endHue.max=360
        //% group="빛박 제어(심화)"
        //% weight=70 blockGap=8
        showRainbow(startHue: number = 1, endHue: number = 360) {
            if (this._length <= 0) return;

            startHue = startHue >> 0;
            endHue = endHue >> 0;
            const saturation = 100;
            const luminance = 50;
            const steps = this._length;
            const direction = HueInterpolationDirection.Clockwise;

            const hue1 = startHue;
            const hue2 = endHue;
            const hueDistCW = ((hue2 + 360) - hue1) % 360;
            const hueStepCW = Math.idiv((hueDistCW * 100), steps);
            const hueDistCCW = ((hue1 + 360) - hue2) % 360;
            const hueStepCCW = Math.idiv(-(hueDistCCW * 100), steps);
            let hueStep: number;
            if (direction === HueInterpolationDirection.Clockwise) {
                hueStep = hueStepCW;
            } else if (direction === HueInterpolationDirection.CounterClockwise) {
                hueStep = hueStepCCW;
            } else {
                hueStep = hueDistCW < hueDistCCW ? hueStepCW : hueStepCCW;
            }
            const hue1_100 = hue1 * 100;

            const sat1 = saturation;
            const satDist = saturation - sat1;
            const satStep = Math.idiv(satDist, steps);
            const sat1_100 = sat1 * 100;

            const lum1 = luminance;
            const lumDist = luminance - lum1;
            const lumStep = Math.idiv(lumDist, steps);
            const lum1_100 = lum1 * 100;

            if (steps === 1) {
                this.setPixelColor(0, hsl(hue1 + hueStep, sat1 + satStep, lum1 + lumStep));
            } else {
                this.setPixelColor(0, hsl(startHue, saturation, luminance));
                for (let i = 1; i < steps - 1; i++) {
                    const h = Math.idiv((hue1_100 + i * hueStep), 100) + 360;
                    const s = Math.idiv((sat1_100 + i * satStep), 100);
                    const l = Math.idiv((lum1_100 + i * lumStep), 100);
                    this.setPixelColor(i, hsl(h, s, l));
                }
                this.setPixelColor(steps - 1, hsl(endHue, saturation, luminance));
            }
            this.show();
        }

        /**
         * 값에 따라 LED로 막대 그래프를 표시합니다.
         * @param value 현재 값
         * @param high 최대 값, eg: 255
         */
        //% blockId="bitbox_show_bar_graph"
        //% block="%strip| 라이트 그래프 효과 - 값: %value|, 최대값: %high"
        //% strip.defl=strip
        //% group="빛박 제어(심화)"
        //% weight=60 blockGap=8
        showBarGraph(value: number, high: number): void {
            if (high <= 0) {
                this.clear();
                this.setPixelColor(0, NeoPixelColors.Yellow);
                this.show();
                return;
            }

            value = Math.abs(value);
            const n = this._length;
            const n1 = n - 1;
            let v = Math.idiv((value * n), high);
            if (v == 0) {
                this.setPixelColor(0, 0x666600);
                for (let i = 1; i < n; ++i)
                    this.setPixelColor(i, 0);
            } else {
                for (let i = 0; i < n; ++i) {
                    if (i <= v) {
                        const b = Math.idiv(i * 255, n1);
                        this.setPixelColor(i, bitbox.rgb(b, 0, 255 - b));
                    } else {
                        this.setPixelColor(i, 0);
                    }
                }
            }
            this.show();
        }

        /**
         * LED를 앞으로 이동하고 빈 자리는 꺼짐으로 채웁니다. (표시하려면 '설정한대로 켜기' 블록 필요)
         * @param offset 이동할 픽셀 수, eg: 1
         */
        //% blockId="bitbox_shift"
        //% block="%strip| 라이트 %offset| 칸 이동"
        //% strip.defl=strip
        //% group="빛박 제어(심화)"
        //% weight=50 blockGap=8
        shift(offset: number = 1): void {
            offset = offset >> 0;
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buffer.shift(-offset * stride, this.start * stride, this._length * stride);
        }

        /**
         * LED를 앞으로 회전합니다. (표시하려면 '설정한대로 켜기' 블록 필요)
         * @param offset 회전할 픽셀 수, eg: 1
         */
        //% blockId="bitbox_rotate"
        //% block="%strip| 라이트 %offset| 칸 회전"
        //% strip.defl=strip
        //% group="빛박 제어(심화)"
        //% weight=49 blockGap=8
        rotate(offset: number = 1): void {
            offset = offset >> 0;
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buffer.rotate(-offset * stride, this.start * stride, this._length * stride);
        }

        /**
         * 라이트의 개수를 가져옵니다.
         */
        //% blockId="bitbox_length"
        //% block="%strip| 라이트의 개수"
        //% strip.defl=strip
        //% group="빛박 제어(심화)"
        //% weight=40 blockGap=8
        getLength() {
            return this._length;
        }

        /**
         * 매트릭스 형태의 LED 너비를 설정합니다.
         * @param width 한 행의 LED 개수
         * @param rotation 회전 방향
         * @param chain 연결 방식
         */
        //% blockId="bitbox_set_matrix_width"
        //% block="%strip| 매트릭스 너비: %width|, 회전: %rotation|, 연결: %chain"
        //% strip.defl=strip
        //% group="빛박 제어(심화)"
        //% weight=30 blockGap=8
        setMatrixWidth(width: number, rotation: number, chain: number) {
            this.matrixWidth = Math.min(this._length, width >> 0);
            this.matrixRotation = rotation >> 0;
            this.matrixChain = chain >> 0;
        }

        /**
         * 매트릭스 특정 위치의 LED 색상을 설정합니다. (표시하려면 '설정한대로 켜기' 블록 필요)
         * @param x 가로 위치
         * @param y 세로 위치
         * @param rgb LED 색상
         */
        //% blockId="bitbox_set_matrix_color"
        //% block="%strip| 매트릭스 x: %x|, y: %y| 위치 색상을 %rgb=bitbox_colors 으로 설정"
        //% strip.defl=strip
        //% group="빛박 제어(심화)"
        //% weight=29 blockGap=8
        setMatrixColor(x: number, y: number, rgb: number) {
            if (this.matrixWidth <= 0) return;
            x = x >> 0;
            y = y >> 0;
            rgb = rgb >> 0;
            const cols = Math.idiv(this._length, this.matrixWidth);
            if (this.matrixRotation == 1) {
                let t = y; y = x; x = t;
            } else if (this.matrixRotation == 2) {
                x = this.matrixWidth - x - 1;
            }
            if (this.matrixChain == 1 && y % 2 == 1) {
                x = this.matrixWidth - x - 1;
            }
            if (x < 0 || x >= this.matrixWidth || y < 0 || y >= cols) return;
            this.setPixelColor(x + y * this.matrixWidth, rgb);
        }

        /**
         * 네오픽셀이 연결된 핀을 설정합니다.
         */
        //% weight=10
        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 0);
        }

        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            if (this.mode === NeoPixelMode.RGB_RGB) {
                this.buffer[offset + 0] = red;
                this.buffer[offset + 1] = green;
            } else {
                this.buffer[offset + 0] = green;
                this.buffer[offset + 1] = red;
            }
            this.buffer[offset + 2] = blue;
        }

        private setAllRGB(rgb: number) {
            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);
            const br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            const end = this.start + this._length;
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * stride, red, green, blue);
            }
        }

        private setPixelRGB(pixelOffset: number, rgb: number): void {
            if (pixelOffset < 0 || pixelOffset >= this._length) return;
            let stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            pixelOffset = (pixelOffset + this.start) * stride;
            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);
            let br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            this.setBufferRGB(pixelOffset, red, green, blue);
        }
    }

    // ======================== 빛박 제어(기초) ========================

    /**
     * 네오픽셀 LED 스트립을 초기화합니다.
     * @param pin 연결된 핀
     * @param numLeds LED 개수, eg: 24,30,60,64
     */
    //% blockId="bitbox_create"
    //% block="%pin| 에 연결된 %numLeds| 개의 %mode| 타입 라이트"
    //% group="빛박 제어(기초)"
    //% weight=100 blockGap=8
    //% trackArgs=0,2
    //% blockSetVariable=strip
    //% pin.defl=DigitalPin.P0
    //% numLeds.defl=8
    export function create(pin: DigitalPin, numLeds: number, mode: NeoPixelMode): Strip {
        let strip = new Strip();
        let stride = mode === NeoPixelMode.RGBW ? 4 : 3;
        strip.buffer = pins.createBuffer(numLeds * stride);
        strip.start = 0;
        strip._length = numLeds;
        strip.mode = mode || NeoPixelMode.RGB;
        strip.matrixWidth = 0;
        strip.setBrightness(128);
        strip.setPin(pin);
        return strip;
    }

    // ======================== 색상 블록 ========================

    /**
     * 빨강, 초록, 파랑 값으로 색상을 만듭니다.
     */
    //% blockId="bitbox_rgb"
    //% block="빨강(R): %red| 초록(G): %green| 파랑(B): %blue"
    //% red.min=0 red.max=255
    //% green.min=0 green.max=255
    //% blue.min=0 blue.max=255
    //% group="색상 블록"
    //% weight=20 blockGap=8
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * 색상 팔레트에서 직접 색상을 선택합니다.
     */
    //% blockId="bitbox_pick_color"
    //% block="색상 선택 %color"
    //% color.shadow="colorNumberPicker"
    //% group="색상 블록"
    //% weight=40 blockGap=8
    export function pickColor(color: number): number {
        return packRGB(unpackR(color), unpackG(color), unpackB(color));
    }

    /**
     * 지정한 색상의 값을 가져옵니다.
     */
    //% blockId="bitbox_colors"
    //% block="%color"
    //% group="색상 블록"
    //% weight=30 blockGap=8
    export function colors(color: NeoPixelColors): number {
        return color;
    }

    /**
     * 색조(H), 채도(S), 명도(L) 값으로 색상을 만듭니다.
     */
    //% blockId="bitboxHSL"
    //% block="색조(H): %hue| 채도(S): %saturation| 명도(L): %luminance"
    //% hue.min=0 hue.max=360
    //% saturation.min=0 saturation.max=99
    //% luminance.min=0 luminance.max=99
    //% group="색상 블록"
    //% weight=10 blockGap=8
    export function hsl(hue: number, saturation: number, luminance: number): number {
        hue = Math.round(hue);
        saturation = Math.round(saturation);
        luminance = Math.round(luminance);
        hue = hue % 360;
        saturation = Math.clamp(0, 99, saturation);
        luminance = Math.clamp(0, 99, luminance);
        let chroma = Math.idiv((((100 - Math.abs(2 * luminance - 100)) * saturation) << 8), 10000);
        let hueSeg = Math.idiv(hue, 60);
        let hueRem = Math.idiv((hue - hueSeg * 60) * 256, 60);
        let temp = Math.abs((((hueSeg % 2) << 8) + hueRem) - 256);
        let secondary = (chroma * (256 - temp)) >> 8;
        let r: number;
        let g: number;
        let b: number;
        if (hueSeg == 0) { r = chroma; g = secondary; b = 0; }
        else if (hueSeg == 1) { r = secondary; g = chroma; b = 0; }
        else if (hueSeg == 2) { r = 0; g = chroma; b = secondary; }
        else if (hueSeg == 3) { r = 0; g = secondary; b = chroma; }
        else if (hueSeg == 4) { r = secondary; g = 0; b = chroma; }
        else if (hueSeg == 5) { r = chroma; g = 0; b = secondary; }
        let match = Math.idiv((Math.idiv((luminance * 2 << 8), 100) - chroma), 2);
        return packRGB(r + match, g + match, b + match);
    }

    // ======================== AI 데이터 활용 ========================

    export enum UARTDataType {
        //% block="X 좌표"
        X,
        //% block="Y 좌표"
        Y,
        //% block="너비"
        W,
        //% block="높이"
        H,
        //% block="객체 수"
        D
    }

    export enum ColorDataType {
        //% block="빨간색(R)"
        R,
        //% block="초록색(G)"
        G,
        //% block="파랑색(B)"
        B,
        //% block="클래스 ID(I)"
        I
    }

    export enum ReturnFormat {
        //% block="문자형"
        String,
        //% block="정수형"
        Number
    }

    export enum FaceDataType {
        //% block="X 좌표"
        X,
        //% block="Y 좌표"
        Y,
        //% block="거리(Z)"
        Z,
        //% block="좌우회전(Yaw)"
        Yaw,
        //% block="상하각도(Pitch)"
        Pitch,
        //% block="입벌림"
        Mouth,
        //% block="왼쪽 눈"
        LeftEye,
        //% block="오른쪽 눈"
        RightEye,
        //% block="기울기(Roll)"
        Roll,
        //% block="웃음"
        Smile,
        //% block="얼굴 감지 여부"
        Visible
    }

    export enum HandDataType {
        //% block="왼쪽 방향"
        LeftDir,
        //% block="왼쪽 속도"
        LeftSpeed,
        //% block="오른쪽 방향"
        RightDir,
        //% block="오른쪽 속도"
        RightSpeed
    }

    /**
     * 블루투스 수신 값에서 사물인식 데이터를 추출합니다.
     */
    //% group="AI 데이터 활용"
    //% block="블루투스 수신 값: %data 에서 사물 %type 을 %format 으로 추출"
    //% inlineInputMode=inline
    //% weight=70
    export function parseUARTUnified(data: string, type: UARTDataType, format: ReturnFormat): any {
        if (data == "null" || data == "stop") {
            return format == ReturnFormat.String ? data : -1;
        }
        let v = getValue(data, uartKey(type));
        if (format == ReturnFormat.String) return v;
        let num = parseInt(v);
        return isNaN(num) ? -1 : num;
    }

    /**
     * 블루투스 수신 값에서 컬러인식 데이터를 추출합니다.
     */
    //% group="AI 데이터 활용"
    //% block="블루투스 수신 값: %data 에서 컬러 %color 을 %format 으로 추출"
    //% inlineInputMode=inline
    //% weight=69
    export function parseColorUnified(data: string, color: ColorDataType, format: ReturnFormat): any {
        if (data == "stop") {
            return format == ReturnFormat.String ? data : -1;
        }
        let v = getValue(data, colorKey(color));
        if (format == ReturnFormat.String) return v;
        let num = parseInt(v);
        return isNaN(num) ? -1 : num;
    }

    /**
     * 블루투스 수신 값에서 얼굴인식 데이터를 추출합니다.
     */
    //% group="AI 데이터 활용"
    //% block="블루투스 수신 값: %data 에서 얼굴 %type 추출"
    //% weight=68
    export function parseFaceUnified(data: string, type: FaceDataType): number {
        if (data == "stop" || data.length < 19) return -1;
        let valStr = "";
        switch (type) {
            case FaceDataType.X:        valStr = data.substr(0, 2);  break;
            case FaceDataType.Y:        valStr = data.substr(2, 2);  break;
            case FaceDataType.Z:        valStr = data.substr(4, 2);  break;
            case FaceDataType.Yaw:      valStr = data.substr(6, 2);  break;
            case FaceDataType.Pitch:    valStr = data.substr(8, 2);  break;
            case FaceDataType.Mouth:    valStr = data.substr(10, 2); break;
            case FaceDataType.LeftEye:  valStr = data.substr(12, 2); break;
            case FaceDataType.RightEye: valStr = data.substr(14, 2); break;
            case FaceDataType.Roll:     valStr = data.substr(16, 1); break;
            case FaceDataType.Smile:    valStr = data.substr(17, 1); break;
            case FaceDataType.Visible:  valStr = data.substr(18, 1); break;
        }
        let num = parseInt(valStr);
        return isNaN(num) ? -1 : num;
    }

    /**
     * 블루투스 수신 값에서 핸드포즈 데이터를 추출합니다.
     * 패킷 포맷: L{D}{SSS}R{D}{SSS} (예: LF255RB255)
     */
    //% group="AI 데이터 활용"
    //% block="블루투스 수신 값: %data 에서 핸드포즈 %type 을 %format 으로 추출"
    //% inlineInputMode=inline
    //% weight=67
    export function parseHandPoseUnified(data: string, type: HandDataType, format: ReturnFormat): any {
        if (data == "stop" || data.length < 10 || data.charAt(0) != "L") {
            return format == ReturnFormat.String ? "0" : -1;
        }
        let valStr = "";
        switch (type) {
            case HandDataType.LeftDir:
                valStr = data.charAt(1);
                if (format == ReturnFormat.Number) {
                    return valStr == "F" ? 1 : (valStr == "B" ? -1 : 0);
                }
                return valStr;
            case HandDataType.LeftSpeed:
                valStr = data.substr(2, 3);
                break;
            case HandDataType.RightDir:
                valStr = data.charAt(6);
                if (format == ReturnFormat.Number) {
                    return valStr == "F" ? 1 : (valStr == "B" ? -1 : 0);
                }
                return valStr;
            case HandDataType.RightSpeed:
                valStr = data.substr(7, 3);
                break;
        }
        if (format == ReturnFormat.String) return valStr;
        let num = parseInt(valStr);
        return isNaN(num) ? 0 : num;
    }

    // ======================== 내부 헬퍼 함수 ========================

    function getValue(data: string, key: string): string {
        let start = data.indexOf(key);
        if (start < 0) return "";
        let end = data.length;
        const keys = ["x", "y", "w", "h", "d", "I", "R", "G", "B", "\n"];
        for (let k of keys) {
            if (k != key) {
                const i = data.indexOf(k, start + 1);
                if (i >= 0 && i < end) {
                    end = i;
                }
            }
        }
        return data.substr(start + 1, end - start - 1);
    }

    function uartKey(type: UARTDataType): string {
        switch (type) {
            case UARTDataType.X: return "x";
            case UARTDataType.Y: return "y";
            case UARTDataType.W: return "w";
            case UARTDataType.H: return "h";
            case UARTDataType.D: return "d";
            default: return "";
        }
    }

    function colorKey(color: ColorDataType): string {
        switch (color) {
            case ColorDataType.R: return "R";
            case ColorDataType.G: return "G";
            case ColorDataType.B: return "B";
            case ColorDataType.I: return "I";
            default: return "";
        }
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function unpackR(rgb: number): number { return (rgb >> 16) & 0xFF; }
    function unpackG(rgb: number): number { return (rgb >> 8) & 0xFF; }
    function unpackB(rgb: number): number { return rgb & 0xFF; }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }
}
