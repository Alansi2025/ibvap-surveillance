"""
Generates a realistic test video for border surveillance AI analytics.
"""

import cv2
import numpy as np
import math

def generate_test_video(filename="test_border_feed.mp4", duration_sec=15, fps=30):
    w, h = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filename, fourcc, fps, (w, h))

    total_frames = duration_sec * fps

    for i in range(total_frames):
        t = i / fps
        img = np.zeros((h, w, 3), dtype=np.uint8)

        # Terrain background
        for y in range(h):
            ratio = y / h
            r = int(25 + 30 * ratio)
            g = int(35 + 40 * ratio)
            b = int(45 + 35 * ratio)
            img[y, :] = (b, g, r)

        # Fence
        fence_y = 350
        cv2.line(img, (0, fence_y), (w, fence_y - 20), (70, 70, 80), 3)
        for fx in range(0, w, 40):
            cv2.line(img, (fx, fence_y - 60), (fx, fence_y + 40), (80, 85, 95), 2)

        # Guard (Walking)
        gx = int(140 + 60 * math.sin(t * 0.8))
        gy = int(260 + 5 * math.cos(t * 0.8))
        cv2.rectangle(img, (gx, gy), (gx + 30, gy + 80), (30, 150, 30), -1)
        cv2.circle(img, (gx + 15, gy - 10), 12, (200, 180, 140), -1)

        # Infiltrator (Crawling / Prone near fence)
        cx = int(300 + (t * 20) % 240)
        cy = int(340 + 3 * math.sin(t * 3))
        cv2.rectangle(img, (cx, cy), (cx + 75, cy + 25), (20, 20, 180), -1)
        cv2.circle(img, (cx + 70, cy + 12), 9, (180, 150, 120), -1)

        # Vehicle
        vx = int(w - 120 - (t * 35) % (w - 60))
        vy = int(180 + 3 * math.sin(t))
        cv2.rectangle(img, (vx, vy), (vx + 90, vy + 45), (120, 100, 40), -1)
        cv2.rectangle(img, (vx + 15, vy + 30), (vx + 75, vy + 45), (255, 255, 255), -1)
        cv2.putText(img, "WR768R", (vx + 18, vy + 42), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 1)

        out.write(img)

    out.release()
    print(f"[*] Generated test video '{filename}' ({total_frames} frames).")

if __name__ == "__main__":
    generate_test_video("/Users/ciel/Downloads/test_border_feed.mp4")
