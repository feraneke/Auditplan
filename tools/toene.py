# Erzeugt die mitgelieferten Toene (16 bit, mono, 44,1 kHz) fuer res/raw.
# Version: 1.1.0 (2026-11-26)
# Versionshistorie:
#   1.0.0 (2026-11-25) sonar.wav, gong.wav
#   1.1.0 (2026-11-26) Stufe A2: glocke.wav, klangschale.wav, holzblock.wav, piep.wav
# Aufruf: python toene.py app/src/main/res/raw
import numpy as np, wave, sys
SR = 44100
def save(name, x):
    x = x / np.max(np.abs(x)) * 0.95
    d = (x * 32767).astype(np.int16)
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
def zeit(dur): return np.arange(int(SR*dur)) / SR
def ping(t, f):
    env = np.exp(-t * 6.0) * np.minimum(1, t / 0.004)
    return np.sin(2*np.pi*f*t) * env + 0.25*np.sin(2*np.pi*2*f*t) * np.exp(-t*12)
def partial(t, teile):
    return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for f, a, d in teile) * np.minimum(1, t/0.005)
ziel = sys.argv[1]
# Sonar: Ping mit zwei leiseren Echos
t = zeit(2.2); x = np.zeros_like(t)
for delay, amp in [(0, 1.0), (0.55, 0.35), (1.1, 0.12)]:
    tt = t - delay; m = tt >= 0
    x[m] += amp * ping(tt[m], 1180 - 30*delay)
save(ziel + '/sonar.wav', x)
# Gong: tiefe, unharmonische Teiltoene mit langem Ausklang
t = zeit(5.5)
parts = [(110,1.0,0.7),(176,0.6,0.9),(233,0.5,1.1),(297,0.35,1.4),(412,0.25,1.8),(523,0.18,2.4),(689,0.12,3.0)]
x = sum(a*np.sin(2*np.pi*f*t*(1+0.002*np.sin(2*np.pi*0.7*t)))*np.exp(-t*d) for f,a,d in parts)
x *= np.minimum(1, t/0.008)
x += np.random.default_rng(1).normal(0,1,len(t))*np.exp(-t*30)*0.3
save(ziel + '/gong.wav', x)
# Glocke: hell, Teiltoene einer Kirchenglocke (Hum, Prime, Terz, Quinte, Oktave)
t = zeit(3.5)
save(ziel + '/glocke.wav', partial(t, [(440,0.5,0.8),(880,1.0,1.2),(1056,0.6,1.6),(1320,0.4,2.0),(1760,0.35,2.6),(2200,0.2,3.5)]))
# Klangschale: zwei fast gleiche Toene mit Schwebung, sehr langer Ausklang
t = zeit(6.0)
save(ziel + '/klangschale.wav', partial(t, [(320,1.0,0.45),(323,0.9,0.45),(865,0.4,0.8),(1590,0.15,1.4)]))
# Holzblock: kurzer, trockener Schlag (zweimal)
t = zeit(0.9); x = np.zeros_like(t)
for delay in (0, 0.28):
    tt = t - delay; m = tt >= 0
    x[m] += partial(tt[m], [(820,1.0,35),(1640,0.4,50),(2470,0.2,60)])
save(ziel + '/holzblock.wav', x)
# Kurzer Piep: 0,15 s Sinus 1500 Hz mit weichen Flanken
t = zeit(0.25); env = np.minimum(1, t/0.01) * np.minimum(1, np.maximum(0, (0.16 - t))/0.01)
save(ziel + '/piep.wav', np.sin(2*np.pi*1500*t) * env)
