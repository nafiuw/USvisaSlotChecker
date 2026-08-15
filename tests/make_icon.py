from PIL import Image, ImageDraw

size = 128
image = Image.new('RGBA', (size, size), (29, 78, 216, 255))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((15, 15, 113, 113), radius=22, fill=(255, 255, 255, 255))
draw.rounded_rectangle((28, 30, 100, 98), radius=12, fill=(29, 78, 216, 255))
draw.rectangle((36, 42, 92, 48), fill=(255, 255, 255, 255))
draw.rectangle((36, 57, 77, 63), fill=(255, 255, 255, 255))
draw.rectangle((36, 72, 84, 78), fill=(255, 255, 255, 255))
draw.ellipse((84, 71, 97, 84), fill=(239, 178, 40, 255))
image.save('/home/ubuntu/visa-slot-extension/assets/icon-128.png')
