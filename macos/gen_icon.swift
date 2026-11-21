import AppKit
import Foundation

// Renders a 1024x1024 Braun-inspired geometric TooToo Bunny macOS App Icon
func drawTooTooIcon(size: CGFloat) -> NSImage {
    let img = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
        let s = size / 1024.0
        guard let ctx = NSGraphicsContext.current?.cgContext else { return false }
        ctx.scaleBy(x: s, y: s)

        // Warm alabaster squircle background
        let bgRect = CGRect(x: 44, y: 44, width: 936, height: 936)
        let bgPath = NSBezierPath(roundedRect: bgRect, xRadius: 215, yRadius: 215)
        NSColor(calibratedRed: 0.957, green: 0.941, blue: 0.910, alpha: 1.0).setFill()
        bgPath.fill()

        // Subtle warm paper border
        NSColor(calibratedRed: 0.85, green: 0.82, blue: 0.76, alpha: 1.0).setStroke()
        bgPath.lineWidth = 10
        bgPath.stroke()

        // Subtle drafting dot grid accent in corners
        NSColor(calibratedRed: 0.09, green: 0.09, blue: 0.08, alpha: 0.06).setFill()
        for gx in stride(from: 130, through: 894, by: 64) {
            for gy in stride(from: 130, through: 894, by: 64) {
                NSBezierPath(ovalIn: CGRect(x: gx - 3, y: gy - 3, width: 6, height: 6)).fill()
            }
        }

        let ink = NSColor(calibratedRed: 0.09, green: 0.086, blue: 0.078, alpha: 1.0)
        let vermilion = NSColor(calibratedRed: 0.898, green: 0.282, blue: 0.149, alpha: 1.0)
        let cream = NSColor(calibratedRed: 0.992, green: 0.988, blue: 0.976, alpha: 1.0)

        // Left ear (outer charcoal + inner vermilion)
        ctx.saveGState()
        ctx.translateBy(x: 392, y: 560)
        ctx.rotate(by: 11 * .pi / 180)
        let leftOuter = NSBezierPath(roundedRect: CGRect(x: -72, y: -20, width: 144, height: 345), xRadius: 72, yRadius: 72)
        ink.setFill()
        leftOuter.fill()
        let leftInner = NSBezierPath(roundedRect: CGRect(x: -36, y: 24, width: 72, height: 245), xRadius: 36, yRadius: 36)
        vermilion.setFill()
        leftInner.fill()
        ctx.restoreGState()

        // Right ear (playfully tilted right!)
        ctx.saveGState()
        ctx.translateBy(x: 632, y: 550)
        ctx.rotate(by: -17 * .pi / 180)
        let rightOuter = NSBezierPath(roundedRect: CGRect(x: -72, y: -20, width: 144, height: 335), xRadius: 72, yRadius: 72)
        ink.setFill()
        rightOuter.fill()
        let rightInner = NSBezierPath(roundedRect: CGRect(x: -36, y: 24, width: 72, height: 235), xRadius: 36, yRadius: 36)
        vermilion.setFill()
        rightInner.fill()
        ctx.restoreGState()

        // Chubby geometric bunny head
        let headRect = CGRect(x: 212, y: 185, width: 600, height: 460)
        let head = NSBezierPath(roundedRect: headRect, xRadius: 230, yRadius: 225)
        ink.setFill()
        head.fill()

        // Inner cream face plate (Braun instrument feel)
        let faceRect = CGRect(x: 246, y: 218, width: 532, height: 394)
        let face = NSBezierPath(roundedRect: faceRect, xRadius: 196, yRadius: 192)
        cream.setFill()
        face.fill()

        // Cute eyes
        ink.setFill()
        NSBezierPath(ovalIn: CGRect(x: 372, y: 392, width: 58, height: 74)).fill()
        NSBezierPath(ovalIn: CGRect(x: 594, y: 392, width: 58, height: 74)).fill()

        // Eye specular catchlights
        cream.setFill()
        NSBezierPath(ovalIn: CGRect(x: 386, y: 438, width: 18, height: 18)).fill()
        NSBezierPath(ovalIn: CGRect(x: 608, y: 438, width: 18, height: 18)).fill()

        // Soft vermilion cheeks
        NSColor(calibratedRed: 0.898, green: 0.282, blue: 0.149, alpha: 0.22).setFill()
        NSBezierPath(ovalIn: CGRect(x: 298, y: 336, width: 78, height: 46)).fill()
        NSBezierPath(ovalIn: CGRect(x: 648, y: 336, width: 78, height: 46)).fill()

        // Vermilion pill nose
        vermilion.setFill()
        NSBezierPath(roundedRect: CGRect(x: 484, y: 356, width: 56, height: 34), xRadius: 17, yRadius: 17).fill()

        // Cute tiny 'w' mouth
        let mouth = NSBezierPath()
        mouth.move(to: NSPoint(x: 464, y: 328))
        mouth.curve(to: NSPoint(x: 512, y: 336), controlPoint1: NSPoint(x: 478, y: 306), controlPoint2: NSPoint(x: 500, y: 308))
        mouth.curve(to: NSPoint(x: 560, y: 328), controlPoint1: NSPoint(x: 524, y: 308), controlPoint2: NSPoint(x: 546, y: 306))
        ink.setStroke()
        mouth.lineWidth = 14
        mouth.lineCapStyle = .round
        mouth.stroke()

        // Telemetry pulse indicator dot at bottom right of squircle
        vermilion.setFill()
        NSBezierPath(ovalIn: CGRect(x: 822, y: 120, width: 54, height: 54)).fill()

        return true
    }
    return img
}

let outDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "AppIcon.iconset"
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

let specs: [(String, Int)] = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024),
]

for (name, px) in specs {
    let img = drawTooTooIcon(size: CGFloat(px))
    guard let tiff = img.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else { continue }
    let path = (outDir as NSString).appendingPathComponent(name)
    try? png.write(to: URL(fileURLWithPath: path))
}
print("Generated iconset at \(outDir)")
