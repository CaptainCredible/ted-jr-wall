let strip = neopixel.create(DigitalPin.P0,12, NeoPixelMode.RGB)
//strip.showRainbow(1, 360);
let pinTurnOnTime = [0,0,0,0];
let muted = false
function bytesToArray(bits: number) {
    let noteArray = [];
    let bitCheckMask = 1
    let arrayPos = 0;
    for (let i = 0; i <= 16 - 1; i++) {
        if (bitCheckMask & bits) {
            noteArray.push(i);
        }
        bitCheckMask = bitCheckMask << 1;
    }
    return noteArray;
}


const NOTE_ON = 0x90
const NOTE_OFF = 0x80
radio.setGroup(83)

input.onButtonPressed(Button.A, function () {
    radio.sendValue("CatP", 0b0001001000100000)
})

//let outputPins = [DigitalPin.P1, DigitalPin.P2, DigitalPin.P8, DigitalPin.P16]
//let outputPins = [101, 102, 108, 116]
let outputPins = [116, 108, 102, 101 ]

radio.onReceivedValue(function (name: string, value: number) {
    if (!muted) {
        if (name == "Ted") {
            for(let p = 0; p < 3; p++){
            strip.setPixelColor(p, neopixel.colors(neopixel.rgb(value*32, 255, 255-value*32)))
            }
            if(value>=4){
                    pins.digitalWritePin(outputPins[value-4],1)
                    for(let i = 0; i<5; i++){
                        led.plot(i, value-4)
                    }
                    pinTurnOnTime[value-4] = input.runningTime()
            }
        } else if (name == "TedP") {
            let bitCheckMask = 1
            for (let i = 0; i <= 16 - 1; i++) {
                if (bitCheckMask & value) {
                    for (let p = 0; p < 3; p++) {
                        strip.showRainbow(i*45,i*45+30);
                    }
                    if (i>=4) {
                        for (let j = 0; j < 5; j++) {
                            led.plot(j, i-4)
                        }
                        triggerPin(i-4);
                    }
                }
                bitCheckMask = bitCheckMask << 1
            }
        }
    }



    if (name == "m") {
        /*
        Bob 00000001
        Tim 00000010
        Ted 00000100
        Pat 00001000
        Cat 00010000
        Dad 00100000
        Mum 01000000
        Zim 10000000
        */
        muted=false;

        if (value & 0b00000100) {
            muted = true
            
            basic.showLeds(`
            # . . . #
            . # . # .
            . . # . .
            . # . # .
            # . . . #
            `,0)
        } 
    }
})

function triggerPin(pinToTrig: number){
    if(input.runningTime() < pinTurnOnTime[pinToTrig] + onTime){
        
        control.inBackground(function() {
            pins.digitalWritePin(outputPins[pinToTrig], 0)
            basic.pause(30);
            pins.digitalWritePin(outputPins[pinToTrig], 1)
            pinTurnOnTime[pinToTrig] = input.runningTime()
        })
    }
    pins.digitalWritePin(outputPins[pinToTrig], 1)
    pinTurnOnTime[pinToTrig] = input.runningTime()
    
}

let onTime = 200;

basic.forever(function() {
    for(let i = 0; i < 4; i++){
        
        if (pinTurnOnTime[i] + onTime < input.runningTime()) {
            pins.digitalWritePin(outputPins[i], 0)
            for (let j = 0; j < 5; j++) {
                led.unplot(j, i)
            }
        }
        
    }
    strip.shift()
    strip.show()
})


input.onButtonPressed(Button.A, function() {
    strip.rotate(1)
    strip.show()  
})

input.onButtonPressed(Button.B, function () {
    strip.rotate(-1)
    strip.show()
})

function noteOn(note: number, velocity: number, channel: number) {
    let midiMessage = pins.createBuffer(3);
    midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_ON | channel);
    midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
    midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
    serial.writeBuffer(midiMessage);
}

function noteOff(note: number, velocity: number, channel: number) {
    let midiMessage = pins.createBuffer(3);
    midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_OFF | channel);
    midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
    midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
    serial.writeBuffer(midiMessage);
}


basic.showLeds(`
    . . . . .
    . . . . .
    . . . . .
    . . . . .
    # # # # #
    `)


let run = false;
let brightness = 0;
let oldPitch = 0;
let transposeOct = 12 * 4