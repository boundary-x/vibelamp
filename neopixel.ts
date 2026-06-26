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
 * VIBE LAMP 네오픽셀 LED 및 디스플레이 제어 블록
 */
//% weight=5 color=#58ACFA icon="\uf005" block="VIBE LAMP"
namespace vibeLamp {

    // MakeCode 내장 안전 드라이버 호출
    //% shim=sendBufferAsm
    function sendBuffer(buf: Buffer, pin: DigitalPin) {
    }

    /**
     * 네오픽셀 스트립 객체
     */
    export class Strip {
        buffer: Buffer;
        _lastBuffer: Buffer; // 🔥 추가: 이전 색상 상태를 기억하는 메모리 공간
        pin: DigitalPin;
        brightness: number;  
        start: number;       
        _length: number;     
        mode: NeoPixelMode;
        matrixWidth: number;
        matrixChain: number;
        matrixRotation: number;

        // ======================== 라이트 제어(기초) ========================

        /**
         * 모든 LED를 지정한 색상으로 켭니다.
         */
        //% blockId="vibelamp_set_strip_color"
        //% block="%strip| 라이트를 모두 %rgb=vibelamp_colors| 으로 켜기"
        //% strip.defl=strip
        //% group="라이트 제어(기초)"
        //% weight=70 blockGap=8
        showColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * 모든 LED를 끕니다.
         */
        //% blockId="vibelamp_clear"
        //% block="%strip| 라이트 모두 끄기"
        //% strip.defl=strip
        //% group="라이트 제어(기초)"
        //% weight=60 blockGap=8
        clear(): void {
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buffer.fill(0, this.start * stride, this._length * stride);
            this.show();
        }

        /**
         * LED 스트립의 밝기를 설정합니다.
         */
        //% blockId="vibelamp_set_brightness"
        //% block="%strip| 라이트의 밝기를 %brightness 로 변경하기"
        //% strip.defl=strip
        //% brightness.min=0 brightness.max=255
        //% group="라이트 제어(기초)"
        //% weight=80 blockGap=8
        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * LED 스트립의 일부 범위를 선택합니다.
         */
        //% blockId="vibelamp_range"
        //% block="%strip| 의 %start| 번째부터 %length| 개의 라이트"
        //% strip.defl=strip
        //% length.defl=8
        //% group="라이트 제어(기초)"
        //% weight=90 blockGap=8
        //% blockSetVariable=range
        createRange(start: number, length: number): Strip {
            start = start >> 0;
            length = length >> 0;
            let strip = new Strip();
            strip.buffer = this.buffer;
            strip._lastBuffer = this._lastBuffer; 
            strip.pin = this.pin;
            strip.brightness = this.brightness;
            strip.start = this.start + Math.clamp(0, this._length - 1, start);
            strip._length = Math.clamp(0, this._length - (strip.start - this.start), length);
            strip.matrixWidth = 0;
            strip.mode = this.mode;
            return strip;
        }

        // ======================== 라이트 제어(심화) ========================

        /**
         * 설정한 내용을 LED 스트립에 표시합니다.
         */
        //% blockId="vibelamp_show"
        //% block="%strip| 라이트를 설정한대로 켜기"
        //% strip.defl=strip
        //% group="라이트 제어(심화)"
        //% weight=80 blockGap=8
        show() {
            let changed = false;
            
            // 🔥 스마트 필터: 이전 색상과 현재 설정하려는 색상이 진짜로 다른지 0.001초만에 비교합니다.
            for (let i = 0; i < this.buffer.length; i++) {
                if (this.buffer[i] !== this._lastBuffer[i]) {
                    changed = true;
                    this._lastBuffer[i] = this.buffer[i]; // 바뀐 부분을 기억 장치에 업데이트
                }
            }
            
            // 🔥 색상이 바뀌었을 때만 네오픽셀 하드웨어로 신호를 보냅니다. (불필요한 스팸 차단 -> 070 에러 완벽 방지)
            if (changed) {
                sendBuffer(this.buffer, this.pin);
            }
        }

        /**
         * 특정 위치의 LED 색상을 설정합니다.
         */
        //% blockId="vibelamp_set_pixel_color"
        //% block="%strip| 의 %pixelOffset| 번째 라이트 색상을 %rgb=vibelamp_colors 으로 설정하기"
        //% strip.defl=strip
        //% group="라이트 제어(심화)"
        //% weight=90 blockGap=8
        setPixelColor(pixelOffset: number, rgb: number): void {
            this.setPixelRGB(pixelOffset >> 0, rgb >> 0);
        }

        /**
         * 모든 LED에 무지개 패턴을 표시합니다.
         */
        //% blockId="vibelamp_set_strip_rainbow"
        //% block="%strip| 라이트 무지개 효과 - 시작색: %startHue|, 종료색: %endHue"
        //% strip.defl=strip
        //% startHue.min=0 startHue.max=360
        //% endHue.min=0 endHue.max=360
        //% group="라이트 제어(심화)"
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
         */
        //% blockId="vibelamp_show_bar_graph"
        //% block="%strip| 라이트 그래프 효과 - 값: %value|, 최대값: %high"
        //% strip.defl=strip
        //% group="라이트 제어(심화)"
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
                        this.setPixelColor(i, vibeLamp.rgb(b, 0, 255 - b));
                    } else {
                        this.setPixelColor(i, 0);
                    }
                }
            }
            this.show();
        }

        /**
         * LED를 앞으로 이동
         */
        //% blockId="vibelamp_shift"
        //% block="%strip| 라이트 %offset| 칸 이동"
        //% strip.defl=strip
        //% group="라이트 제어(심화)"
        //% weight=50 blockGap=8
        shift(offset: number = 1): void {
            offset = offset >> 0;
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buffer.shift(-offset * stride, this.start * stride, this._length * stride);
        }

        /**
         * LED를 앞으로 회전
         */
        //% blockId="vibelamp_rotate"
        //% block="%strip| 라이트 %offset| 칸 회전"
        //% strip.defl=strip
        //% group="라이트 제어(심화)"
        //% weight=49 blockGap=8
        rotate(offset: number = 1): void {
            offset = offset >> 0;
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buffer.rotate(-offset * stride, this.start * stride, this._length * stride);
        }

        /**
         * 라이트의 개수를 가져옵니다.
         */
        //% blockId="vibelamp_length"
        //% block="%strip| 라이트의 개수"
        //% strip.defl=strip
        //% group="라이트 제어(심화)"
        //% weight=40 blockGap=8
        getLength() {
            return this._length;
        }

        //% blockId="vibelamp_set_matrix_width"
        //% block="%strip| 매트릭스 너비: %width|, 회전: %rotation|, 연결: %chain"
        //% strip.defl=strip
        //% group="라이트 제어(심화)"
        //% weight=30 blockGap=8
        setMatrixWidth(width: number, rotation: number, chain: number) {
            this.matrixWidth = Math.min(this._length, width >> 0);
            this.matrixRotation = rotation >> 0;
            this.matrixChain = chain >> 0;
        }

        //% blockId="vibelamp_set_matrix_color"
        //% block="%strip| 매트릭스 x: %x|, y: %y| 위치 색상을 %rgb=vibelamp_colors 으로 설정"
        //% strip.defl=strip
        //% group="라이트 제어(심화)"
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

    // ======================== 라이트 제어(기초) ========================

    /**
     * 네오픽셀 LED 스트립을 초기화합니다.
     */
    //% blockId="vibelamp_create"
    //% block="%pin| 에 연결된 %numLeds| 개의 %mode| 타입 라이트"
    //% group="라이트 제어(기초)"
    //% weight=100 blockGap=8
    //% trackArgs=0,2
    //% blockSetVariable=strip
    //% pin.defl=DigitalPin.P8
    //% numLeds.defl=12
    export function create(pin: DigitalPin, numLeds: number, mode: NeoPixelMode): Strip {
        let strip = new Strip();
        let stride = mode === NeoPixelMode.RGBW ? 4 : 3;
        strip.buffer = pins.createBuffer(numLeds * stride);
        strip._lastBuffer = pins.createBuffer(numLeds * stride); // 🔥 비교용 초기 버퍼 할당
        strip.start = 0;
        strip._length = numLeds;
        strip.mode = mode || NeoPixelMode.RGB;
        strip.matrixWidth = 0;
        strip.setBrightness(128);
        strip.setPin(pin);
        return strip;
    }

    // ======================== 색상 블록 ========================

    //% blockId="vibelamp_rgb"
    //% block="빨강(R): %red| 초록(G): %green| 파랑(B): %blue"
    //% red.min=0 red.max=255
    //% green.min=0 green.max=255
    //% blue.min=0 blue.max=255
    //% group="색상 블록"
    //% weight=20 blockGap=8
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    //% blockId="vibelamp_pick_color"
    //% block="색상 선택 %color"
    //% color.shadow="colorNumberPicker"
    //% group="색상 블록"
    //% weight=40 blockGap=8
    export function pickColor(color: number): number {
        return packRGB(unpackR(color), unpackG(color), unpackB(color));
    }

    //% blockId="vibelamp_colors"
    //% block="%color"
    //% group="색상 블록"
    //% weight=30 blockGap=8
    export function colors(color: NeoPixelColors): number {
        return color;
    }

    //% blockId="vibelampHSL"
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
        X, Y, Z, Yaw, Pitch, Mouth, LeftEye, RightEye, Roll, Smile, Visible
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

    //% group="AI 데이터 활용"
    //% block="블루투스 수신 값: %data 에서 사물 %type 을 %format 으로 추출"
    //% inlineInputMode=inline
    //% weight=70
    export function parseUARTUnified(data: string, type: UARTDataType, format: ReturnFormat): any {
        if (data == "null" || data == "stop") return format == ReturnFormat.String ? data : -1;
        let v = getValue(data, uartKey(type));
        if (format == ReturnFormat.String) return v;
        let num = parseInt(v);
        return isNaN(num) ? -1 : num;
    }

    //% group="AI 데이터 활용"
    //% block="블루투스 수신 값: %data 에서 컬러 %color 을 %format 으로 추출"
    //% inlineInputMode=inline
    //% weight=69
    export function parseColorUnified(data: string, color: ColorDataType, format: ReturnFormat): any {
        if (data == "stop") return format == ReturnFormat.String ? data : -1;
        let v = getValue(data, colorKey(color));
        if (format == ReturnFormat.String) return v;
        let num = parseInt(v);
        return isNaN(num) ? -1 : num;
    }

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
                if (format == ReturnFormat.Number) return valStr == "F" ? 1 : (valStr == "B" ? -1 : 0);
                return valStr;
            case HandDataType.LeftSpeed:
                valStr = data.substr(2, 3);
                break;
            case HandDataType.RightDir:
                valStr = data.charAt(6);
                if (format == ReturnFormat.Number) return valStr == "F" ? 1 : (valStr == "B" ? -1 : 0);
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
                if (i >= 0 && i < end) end = i;
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

    function packRGB(a: number, b: number, c: number): number { return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF); }
    function unpackR(rgb: number): number { return (rgb >> 16) & 0xFF; }
    function unpackG(rgb: number): number { return (rgb >> 8) & 0xFF; }
    function unpackB(rgb: number): number { return rgb & 0xFF; }

    export enum HueInterpolationDirection {
        Clockwise, CounterClockwise, Shortest
    }

    // ======================== 🖥️ OLED DISPLAY 제어 ========================
    // 🔥 OLED 역시 블루투스 간섭을 막기 위한 비동기 렌더링 유지

    const FONT_5X7 = hex`000000000000005F00000007000700147F147F14242A072A12231308646237495522500005030000001C2241000041221C00082A1C2A0808083E080800503000000808080808006060000020100804023E5149453E00427F400042615149462141454B311814127F1027454545393C4A49493001710905033649494936064949291E003636000000563600000008142241141414141441221408000201510906324979413E7E1111117E7F494949363E414141227F4141221C7F494949417F090901013E414151327F0808087F00417F41002040413F017F081422417F404040407F0204027F7F0408107F3E4141413E7F090909063E4151215E7F09192946464949493101017F01013F4040403F1F2040201F7F2018207F63140814630304780403615149454300007F4141020408102041417F000004020102044040404040000102040020545454787F484444383844444420384444487F3854545418087E090102081454543C7F0804047800447D40002040443D00007F10284400417F40007C041804787C0804047838444444387C14141408081414187C7C080404084854545420043F4440203C4040207C1C2040201C3C4030403C44281028440C5050503C4464544C44000836410000007F000000413608000201020402`;

    export enum Display { On = 1, Off = 0 }

    const MIN_X = 0; const MIN_Y = 0; const MAX_X = 127; const MAX_Y = 63;
    let i2cAddress = 60;
    let screen = pins.createBuffer(1025);
    let buffer3 = pins.createBuffer(3);
    let buffer4 = pins.createBuffer(4);
    let buffer7 = pins.createBuffer(7);
    let buffer13 = pins.createBuffer(13);
    
    let drawEnabled = 1;
    let cursorX = 0;
    let cursorY = 0;
    let zoomEnabled = 0;
    let doubleSize = 0;
    let _oledDirty = false;

    function sendCommand1(data: number) {
        pins.i2cWriteNumber(i2cAddress, data % 256, NumberFormat.UInt16BE);
    }
    function sendCommand2(data1: number, data2: number) {
        buffer3[0] = 0; buffer3[1] = data1; buffer3[2] = data2;
        pins.i2cWriteBuffer(i2cAddress, buffer3);
    }
    function sendCommand3(data1: number, data2: number, data3: number) {
        buffer4[0] = 0; buffer4[1] = data1; buffer4[2] = data2; buffer4[3] = data3;
        pins.i2cWriteBuffer(i2cAddress, buffer4);
    }
    function setPosition(column: number = 0, page: number = 0) {
        sendCommand1(0xb0 | page);
        sendCommand1(0x00 | (column % 16));
        sendCommand1(0x10 | (column >> 4));
    }
    function clearBit(data: number, bit: number): number {
        if (data & (1 << bit)) data -= (1 << bit);
        return data;
    }
    function draw(data: number) {
        if (data > 0) _oledDirty = true;
    }

    //% block="디스플레이 색상 반전 %on"
    //% blockGap=8 group="디스플레이 제어" on.shadow="toggleOnOff" weight=2
    export function invert(on: boolean = true) {
        sendCommand1(on ? 0xA7 : 0xA6);
    }

    //% block="디스플레이 지우기"
    //% blockGap=8 group="디스플레이 제어" weight=3
    export function clear() {
        cursorX = cursorY = 0;
        screen.fill(0);
        screen[0] = 0x40;
        draw(1);
    }

    //% block="디스플레이 화면 %on"
    //% on.defl=1 blockGap=8 group="디스플레이 제어" on.shadow="toggleOnOff" weight=1
    export function display(on: boolean) {
        sendCommand1(on ? 0xAF : 0xAE);
    }

    //% block="픽셀 출력 - 위치: x %x y %y, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0 y.max=63 y.min=0 y.defl=0 color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline group="디스플레이 제어(도형)" weight=4
    export function pixel(x: number, y: number, color: number = 1) {
        let page = y >> 3;
        let shiftPage = y % 8;
        let index = x + page * 128 + 1;
        screen[index] = color ? (screen[index] | (1 << shiftPage)) : clearBit(screen[index], shiftPage);
        _oledDirty = true;
    }

    function drawChar(character: string, column: number, row: number, color: number = 1) {
        let position = (Math.min(127, Math.max(character.charCodeAt(0), 32)) - 32) * 5;
        let margin = 0;
        let index = column + row * 128 + 1;

        if (doubleSize) {
            for (let i = 0; i < 5; i++) {
                let line = 0;
                for (let j = 0; j < 8; j++) {
                    if (color > 0 ? FONT_5X7[position + i] & (1 << j) : !(FONT_5X7[position + i] & (1 << j))) {
                        pixel(column + margin, row * 8 + line);
                        pixel(column + margin, row * 8 + line + 1);
                        pixel(column + margin + 1, row * 8 + line);
                        pixel(column + margin + 1, row * 8 + line + 1);
                    }
                    line += 2;
                }
                margin += 2;
            }
            let line = 0;
            for (let j = 0; j < 8; j++) {
                if (color == 0) {
                    pixel(column + 10, row * 8 + line); pixel(column + 10, row * 8 + line + 1);
                    pixel(column + 11, row * 8 + line); pixel(column + 11, row * 8 + line + 1);
                }
                line += 2;
            }
        } else {
            for (let i = 0; i < 5; i++) screen[index + i] = (color > 0) ? FONT_5X7[position + i] : FONT_5X7[position + i] ^ 0xFF;
            screen[index + 5] = (color > 0) ? 0 : 0xFF;
            _oledDirty = true;
        }
    }

    //% block="문장 출력 - 내용: %text, 위치: %column열 %row행, 색상: %color"
    //% text.defl='VIBE LAMP' column.max=120 column.min=0 column.defl=0 row.max=7 row.min=0 row.defl=0 color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline group="디스플레이 제어(데이터)" weight=1
    export function showString(text: string, column: number, row: number, color: number = 1) {
        let steps = doubleSize ? 12 : 6;
        for (let n = 0; n < text.length; n++) {
            drawChar(text.charAt(n), column, row, color);
            column += steps;
        }
        if (doubleSize) draw(1);
    }

    //% block="숫자 출력 - 내용: %number, 위치: %column열 %row행, 색상: %color"
    //% number.defl=777 column.max=120 column.min=0 column.defl=0 row.max=7 row.min=0 row.defl=0 color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline group="디스플레이 제어(데이터)" weight=3
    export function showNumber(number: number, column: number, row: number, color: number = 1) {
        showString(number.toString(), column, row, color);
    }

    function scroll() {
        cursorX = 0; cursorY += doubleSize ? 2 : 1;
        if (cursorY > 7) {
            cursorY = 7;
            screen.shift(128);
            screen[0] = 0x40;
            draw(1);
        }
    }

    //% block="문장 출력 - 내용: %text, 줄바꿈: %newline"
    //% text.defl="VIBE LAMP" newline.defl=true
    //% blockGap=8 inlineInputMode=inline group="디스플레이 제어(데이터)" weight=2
    export function printString(text: string, newline: boolean = true) {
        let steps = doubleSize ? 12 : 6;
        for (let n = 0; n < text.length; n++) {
            drawChar(text.charAt(n), cursorX, cursorY, 1);
            cursorX += steps;
            if (cursorX > 120) scroll();
        }
        if (newline) scroll();
        if (doubleSize) draw(1);
    }

    //% block="숫자 출력 - 내용: %number, 줄바꿈: %newline"
    //% number.defl="777" newline.defl=true
    //% weight=86 blockGap=8 inlineInputMode=inline group="디스플레이 제어(데이터)" weight=4
    export function printNumber(number: number, newline: boolean = true) {
        printString(number.toString(), newline);
    }

    //% block="수평선 출력 - 위치: x %x y %y, 길이: %length, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0 y.max=63 y.min=0 y.defl=0 length.max=128 length.min=1 length.defl=16 color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline group="디스플레이 제어(도형)" weight=2
    export function horizontalLine(x: number, y: number, length: number, color: number = 1) {
        let savedDraw = drawEnabled;
        if ((y < MIN_Y) || (y > MAX_Y)) return;
        drawEnabled = 0;
        for (let i = x; i < (x + length); i++)
            if ((i >= MIN_X) && (i <= MAX_X)) pixel(i, y, color);
        drawEnabled = savedDraw;
        draw(drawEnabled);
    }

    //% block="수직선 출력 - 위치: x %x y %y, 길이: %length, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0 y.max=63 y.min=0 y.defl=0 length.max=128 length.min=1 length.defl=16 color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline group="디스플레이 제어(도형)" weight=1
    export function verticalLine(x: number, y: number, length: number, color: number = 1) {
        let savedDraw = drawEnabled;
        drawEnabled = 0;
        if ((x < MIN_X) || (x > MAX_X)) return;
        for (let i = y; i < (y + length); i++)
            if ((i >= MIN_Y) && (i <= MAX_Y)) pixel(x, i, color);
        drawEnabled = savedDraw;
        draw(drawEnabled);
    }

    //% block="사각형 출력 - x1 %x1 y1 %y1 x2 %x2 y2 %y2, 색상: %color"
    //% color.defl=1 blockGap=8 inlineInputMode=inline group="디스플레이 제어(도형)" weight=3
    export function rectangle(x1: number, y1: number, x2: number, y2: number, color: number = 1) {
        if (x1 > x2) x1 = [x2, x2 = x1][0];
        if (y1 > y2) y1 = [y2, y2 = y1][0];
        drawEnabled = 0;
        horizontalLine(x1, y1, x2 - x1 + 1, color); horizontalLine(x1, y2, x2 - x1 + 1, color);
        verticalLine(x1, y1, y2 - y1 + 1, color); verticalLine(x2, y1, y2 - y1 + 1, color);
        drawEnabled = 1;
        draw(1);
    }

    function initOLED() {
        buffer7[0] = 0x40; buffer13[0] = 0x40;
        sendCommand1(0xAE); sendCommand1(0xA4); sendCommand2(0xD5, 0xF0);
        sendCommand2(0xA8, 0x3F); sendCommand2(0xD3, 0x00); sendCommand1(0 | 0x0);
        sendCommand2(0x8D, 0x14); sendCommand2(0x20, 0x00); sendCommand3(0x21, 0, 127);
        sendCommand3(0x22, 0, 63); sendCommand1(0xa0 | 0x1); sendCommand1(0xc8);
        sendCommand2(0xDA, 0x12); sendCommand2(0x81, 0xCF); sendCommand2(0xd9, 0xF1);
        sendCommand2(0xDB, 0x40); sendCommand1(0xA6); sendCommand2(0xD6, 0);
        sendCommand1(0xAF); clear();

        control.inBackground(function () {
            while (true) {
                if (_oledDirty) {
                    _oledDirty = false;
                    setPosition();
                    pins.i2cWriteBuffer(i2cAddress, screen);
                }
                basic.pause(50);
            }
        });
    }

    initOLED();
}
