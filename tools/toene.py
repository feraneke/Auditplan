# Erzeugt sonar.wav und gong.wav (16 bit, mono, 44,1 kHz) fuer res/raw.
import numpy as np, wave, sys
SR = 44100
def save(name, x):
    x = x / np.max(np.abs(x)) * 0.95
    d = (x * 32767).astype(np.int16)
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
def ping(t, f):
    env = np.exp(-t * 6.0) * np.minimum(1, t / 0.004)
    return np.sin(2*np.pi*f*t) * env + 0.25*np.sin(2*np.pi*2*f*t) * np.exp(-t*12)
# Sonar: Ping mit zwei leiseren Echos
dur = 2.2; t = np.arange(int(SR*dur)) / SR
x = np.zeros_like(t)
for delay, amp in [(0, 1.0), (0.55, 0.35), (1.1, 0.12)]:
    tt = t - delay; m = tt >= 0
    x[m] += amp * ping(tt[m], 1180 - 30*delay)
save(sys.argv[1] + '/sonar.wav', x)
# Gong: tiefe, unharmonische Teiltoene mit langem Ausklang
dur = 5.5; t = np.arange(int(SR*dur)) / SR
parts = [(110,1.0,0.7),(176,0.6,0.9),(233,0.5,1.1),(297,0.35,1.4),(412,0.25,1.8),(523,0.18,2.4),(689,0.12,3.0)]
x = sum(a*np.sin(2*np.pi*f*t*(1+0.002*np.sin(2*np.pi*0.7*t)))*np.exp(-t*d) for f,a,d in parts)
x *= np.minimum(1, t/0.008)
noise = np.random.default_rng(1).normal(0,1,len(t))*np.exp(-t*30)*0.3
save(sys.argv[1] + '/gong.wav', x + noise)
