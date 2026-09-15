"""Regenerates downloads/rafael-de-agua-onesheet.pdf. Facts live at the top; edit them, run `python3 tools/onesheet.py`.
Fonts: Bodoni Moda + Jost TTFs in tools/fonts/ (download from Google Fonts CSS with a browser UA if missing)."""
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader, simpleSplit

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F=os.path.join(ROOT,"tools","fonts")+"/"
OUT=os.path.join(ROOT,"downloads","rafael-de-agua-onesheet.pdf")

NAME=("Rafael","De Agua"); ROLE="DJ / PRODUCER"
META="BASED NEW YORK & NEW JERSEY  ·  AVAILABLE WORLDWIDE  ·  LIKEWTER"
LEDE="Selected rooms only. Private events, members' venues, fashion houses and the after-hours that don't post a flyer. Sets are built for the room, the guest list and the hour: warm-up to peak to the last twenty minutes nobody wants to end."
YES=["Private & invitation-only events","Members' clubs and hotel residencies","Fashion, art and luxury brand activations","Restaurant and lounge music programming","After-hours and late rooms","Yacht, villa and destination dates"]
NO="Sweet sixteens, weddings, karaoke, artist shows."
ROOMS=[("Taverna Veranda","Resident · 4 years running · sister lounge to Pergola, NYC"),("Jersey City Fourth of July Festival","2 years running"),("Jersey City Public Library","Event series · 2 years running"),("Aruba","Destination set · Caribbean"),("Festival stages","Major local festivals · New Jersey")]
SOUND="Afro house · tech house · melodic techno · Latin & flamenco edits · disco & soul · original productions and unreleased edits in every set."
LINKS=["WATER DJ SETS, 13 mixes  ·  soundcloud.com/likewter/sets/water-dj-sets","It's Almost Lunch Time, video series  ·  youtube.com/channel/UCgqDcAzOLqB_O-vrDbRiSwQ","Live streams  ·  Sounds Sessions 001 / 002 / 004, North Bridge Studios"]
EMAIL="supergoodwav@gmail.com"
FOOT="IG @LIKEWTER  ·  SOUNDCLOUD.COM/LIKEWTER  ·  CDJ / VINYL / HYBRID  ·  SETS 2–6 HRS"
COPY="© 2026 RAFAEL DE AGUA · LIKEWTER"

pdfmetrics.registerFont(TTFont("Bod",F+"Bodoni_Moda_ital_opsz_wght_0_6__96_400.ttf")); pdfmetrics.registerFont(TTFont("BodI",F+"Bodoni_Moda_ital_opsz_wght_1_6__96_400.ttf")); pdfmetrics.registerFont(TTFont("Jost",F+"Jost_wght_400.ttf"))
BG=(0.043,0.031,0.035); GOLD=(0.902,0.698,0.302); PAPER=(0.937,0.902,0.839); MUTE=(0.812,0.769,0.698); LINE=(0.35,0.29,0.18)
W,H=letter; M=48
c=canvas.Canvas(OUT,pagesize=letter); c.setTitle("Rafael De Agua — One-Sheet"); c.setAuthor("Rafael De Agua / LIKEWTER")
c.setFillColorRGB(*BG); c.rect(0,0,W,H,fill=1,stroke=0)
def tr(x,y,t,size,track,col,maxw=None):
    c.setFont("Jost",size); c.setFillColorRGB(*col)
    def wid(s): return sum(pdfmetrics.stringWidth(ch,"Jost",size)+track for ch in s)
    lines=[]; line=''
    for w in t.split(' '):
        cand=(line+' '+w).strip()
        if maxw and wid(cand)>maxw and line: lines.append(line); line=w
        else: line=cand
    lines.append(line)
    for ln in lines:
        xx=x
        for ch in ln: c.drawString(xx,y,ch); xx+=pdfmetrics.stringWidth(ch,"Jost",size)+track
        y-=size+5
    return y
def body(x,y,t,size=9.5,col=PAPER,lead=13.5,maxw=W-2*M,font="Jost"):
    for ln in simpleSplit(t,font,size,maxw): c.setFont(font,size); c.setFillColorRGB(*col); c.drawString(x,y,ln); y-=lead
    return y
def rule(y): c.setStrokeColorRGB(*LINE); c.setLineWidth(.5); c.line(M,y,W-M,y)
img=ImageReader(os.path.join(ROOT,"assets","portrait-headphones.jpg")); iw,ih=img.getSize(); pw=200; ph=min(pw*ih/iw,300)
c.drawImage(img,W-M-pw,H-M-ph,pw,ph,preserveAspectRatio=True,anchor='n')
lk=ImageReader(os.path.join(ROOT,"assets","lockup-white.png")); lw,lh=lk.getSize(); c.drawImage(lk,M,H-M-44,110,110*lh/lw,mask='auto')
y=H-M-92; tr(M,y,ROLE,7.5,2.4,GOLD); y-=40
c.setFont("Bod",44); c.setFillColorRGB(*PAPER); c.drawString(M-2,y,NAME[0]); y-=44
c.setFont("BodI",44); c.setFillColorRGB(*GOLD); c.drawString(M+18,y,NAME[1]); y-=26
tr(M,y,META,7.5,2,MUTE); y-=30
y=body(M,y,LEDE,10.5,PAPER,15,W-2*M-pw-24)
y-=8; rule(y); y-=22
colw=(W-2*M-24)/2; x2=M+colw+24
tr(M,y,"BOOKED FOR",7.5,2.4,GOLD); yy=y-16
for t in YES: c.setFont("Jost",9.5); c.setFillColorRGB(*PAPER); c.drawString(M,yy,t); yy-=14
yy-=8; tr(M,yy,"NOT BOOKED FOR",7.5,2.4,MUTE); yy-=18
c.setFont("BodI",14); c.setFillColorRGB(*MUTE); c.drawString(M,yy,NO); tw=pdfmetrics.stringWidth(NO,"BodI",14); c.setStrokeColorRGB(*GOLD); c.setLineWidth(.6); c.line(M,yy+4.5,M+tw,yy+4.5)
tr(x2,y,"SELECTED ROOMS",7.5,2.4,GOLD); yb=y-16
for n,m in ROOMS:
    c.setFont("Bod",12.5); c.setFillColorRGB(*PAPER); c.drawString(x2,yb,n); yb-=12; yb=tr(x2,yb,m.upper(),6.5,1.4,MUTE,colw); yb-=2
yb-=8; tr(x2,yb,"THE SOUND",7.5,2.4,GOLD); yb-=14
yb=body(x2,yb,SOUND,9.5,PAPER,13.5,colw)
y=min(yy,yb)-22; rule(y); y-=20
tr(M,y,"LISTEN & WATCH",7.5,2.4,GOLD); y-=15
for t in LINKS: c.setFont("Jost",9.5); c.setFillColorRGB(*PAPER); c.drawString(M,y,t); y-=13.5
y-=8; rule(y); y-=20
tr(M,y,"BOOKINGS",7.5,2.4,GOLD); y-=19
c.setFont("Bod",16); c.setFillColorRGB(*PAPER); c.drawString(M,y,EMAIL); y-=15
tr(M,y,FOOT,7,1.6,MUTE)
assert y>30, "links line collides with the copyright, trim content"
tr(M,16,COPY,6.5,2,MUTE)
c.showPage(); c.save(); print("wrote",OUT)
