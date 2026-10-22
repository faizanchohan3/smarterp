import numpy as np, wave, sys
sr=44100; dur=float(sys.argv[2]); t=np.arange(int(sr*dur))/sr
def n(m): return 440*2**((m-69)/12)
# progression (4.3s each): Am  F  C  G  repeated
chords=[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]]
L=4.3; bars=int(dur/L)+1
out=np.zeros_like(t)
for b in range(bars):
    c=chords[b%4]; a=b*L; seg=(t>=a)&(t<a+L+1.5); tt=t[seg]-a
    env=np.minimum(tt/1.2,1)*np.exp(-np.maximum(tt-L,0)/0.5)
    for m in c:
        f=n(m)
        out[seg]+=0.05*env*(np.sin(2*np.pi*f*tt)+0.3*np.sin(2*np.pi*2*f*tt+0.5)+0.4*np.sin(2*np.pi*f*1.003*tt))
    out[seg]+=0.08*env*np.sin(2*np.pi*n(c[0]-12)*tt)
    # pluck arpeggio, 8th notes
    step=L/8
    for k in range(8):
        st=a+k*step; s2=(t>=st)&(t<st+1.2); x=t[s2]-st
        m=c[[0,1,2,3,2,1,3,2][k]]+12
        out[s2]+=0.07*np.exp(-x*5)*np.sin(2*np.pi*n(m)*x)*np.minimum(x/0.005,1)
    # soft kick on quarters after intro
    if b>=1:
        for k in range(4):
            st=a+k*L/4; s2=(t>=st)&(t<st+0.4); x=t[s2]-st
            out[s2]+=0.22*np.exp(-x*12)*np.sin(2*np.pi*(50+90*np.exp(-x*30))*x)
# shimmer at start and CTA
for st in (0.2,dur-15.27):
    s2=(t>=st)&(t<st+3); x=t[s2]-st
    out[s2]+=0.04*np.exp(-x*1.2)*sum(np.sin(2*np.pi*n(m)*x) for m in (81,84,88,93))
fade=np.ones_like(t); fade[t>dur-3]=(dur-t[t>dur-3])/3; fade[t<0.5]=t[t<0.5]/0.5
out*=fade; out/=np.abs(out).max()*1.15
pcm=(out*32767).astype(np.int16)
st=np.stack([pcm,pcm],1)
w=wave.open(sys.argv[1],"wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st.tobytes()); w.close()
