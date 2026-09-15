"""Descarga y grada la fotografía de ambiente para KineSaúde Carballo.

Procedencia: el brief pedía "fotografia generada" pero no hay herramienta de
generacion de imagen en este entorno, asi que se usan fotos con licencia
Pexels (uso comercial libre, sin atribucion obligatoria), elegidas para el
concepto "senal / precision / laboratorio calido". Ninguna es una foto real
de KineSaude; la web las etiqueta como "fotografia de ambiente".

  equipo   Pexels #7789605  dispositivo de electroterapia compacto sobre carro
  manos    Pexels #20860604 manos de fisioterapeuta sobre cuello/hombro
  deporte  Pexels #20860607 manos sobre rodilla con banda deportiva
  mov      Pexels #20860612 movilizacion de tobillo/pie
  sala     Pexels #10521232 sala de tratamiento minimalista con luz de aro

Gradacion comun: sombras viradas a grafito (#15191C), luces viradas a teal
de marca (#2A7C92 -> #649CB0), saturacion muy contenida para que las fotos
convivan como una sola familia de color. Sin tinte ambar (el ambar queda
reservado a la interfaz, no a la fotografia).
"""
import os, urllib.request, concurrent.futures
import numpy as np
from PIL import Image, ImageFilter, ImageOps

PHOTOS = {
    "equipo": "7789605",
    "manos": "20860604",
    "deporte": "20860607",
    "mov": "20860612",
    "sala": "10521232",
}
OUT = os.path.join(os.path.dirname(__file__), "photos_out")
os.makedirs(OUT, exist_ok=True)

GRAFITO = np.array([0x15, 0x19, 0x1C]) / 255.0
TEAL_MID = np.array([0x2A, 0x7C, 0x92]) / 255.0
TEAL_HI = np.array([0x8F, 0xBE, 0xCC]) / 255.0


def grade(im: Image.Image) -> Image.Image:
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    lum = a @ np.array([0.299, 0.587, 0.114])
    a = lum[..., None] + (a - lum[..., None]) * 0.42          # saturacion muy contenida (casi duotono)
    sh = np.clip(1.0 - lum, 0, 1)[..., None] ** 1.6
    hi = np.clip(lum - 0.42, 0, 1)[..., None] * 1.5
    a = a + (GRAFITO - 0.5) * 0.30 * sh
    a = a + (TEAL_MID - 0.5) * 0.16 * (1 - sh) * (1 - hi)
    a = a + (TEAL_HI - 0.5) * 0.30 * hi
    a = 0.03 + a * 0.94                                        # negros ligeramente levantados
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def fetch(pid, w):
    url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w={w}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=240) as r:
        return r.read()


def process(name):
    pid = PHOTOS[name]
    src = os.path.join(OUT, f"{name}-src.jpg")
    if not os.path.exists(src):
        with open(src, "wb") as f:
            f.write(fetch(pid, 1800))
    im = ImageOps.exif_transpose(Image.open(src))
    im = grade(im)
    for w in (1600, 900):
        r = im.copy()
        r.thumbnail((w, w * 3), Image.LANCZOS)
        r.save(os.path.join(OUT, f"{name}-{w}.jpg"), quality=82, optimize=True, progressive=True)
    tiny = im.copy()
    tiny.thumbnail((32, 96), Image.LANCZOS)
    tiny.filter(ImageFilter.GaussianBlur(1.5)).save(os.path.join(OUT, f"{name}-lqip.jpg"), quality=45)
    return name, im.size


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(3) as ex:
        for r in ex.map(process, list(PHOTOS)):
            print(r)
