"""
IBVAP - Realistic Border CCTV Video Scenario Generator
Generates high-fidelity simulated border surveillance video streams for out-of-the-box
evaluation, demonstration, and edge testing across various scenarios:
1. Scenario 1 (Night Crawl): Infiltration attempt at Border Sector Alpha (crawling intruder, wire tripwire)
2. Scenario 2 (Vehicle ANPR): International Border Highway Checkpost with incoming vehicles & plates
3. Scenario 3 (Perimeter Loitering): Suspicious subject loitering near Zero Line buffer zone
"""
import math
import time
from typing import Generator, Tuple
import cv2
import numpy as np


class BorderScenarioGenerator:
    def __init__(self, scenario_type: str = "scenario_night_crawl", width: int = 640, height: int = 480):
        self.scenario_type = scenario_type
        self.width = width
        self.height = height
        self.frame_idx = 0
        self.start_time = time.time()

    def get_frame(self) -> np.ndarray:
        self.frame_idx += 1
        elapsed = time.time() - self.start_time

        if self.scenario_type == "scenario_night_crawl":
            return self._generate_night_crawl_frame(elapsed)
        elif self.scenario_type == "scenario_vehicle_anpr":
            return self._generate_vehicle_anpr_frame(elapsed)
        elif self.scenario_type == "scenario_perimeter_loitering":
            return self._generate_loitering_frame(elapsed)
        elif self.scenario_type == "scenario_weapons_contraband":
            return self._generate_weapons_contraband_frame(elapsed)
        elif self.scenario_type == "scenario_riverine_boat":
            return self._generate_riverine_boat_frame(elapsed)
        else:
            return self._generate_weapons_contraband_frame(elapsed)

    def _draw_hud(self, frame: np.ndarray, bop_name: str, cam_id: str, is_night: bool = False):
        """Draws realistic military CCTV On-Screen Display (OSD) / HUD."""
        # Top-left camera telemetry
        ts_str = time.strftime("%Y-%m-%d  %H:%M:%S  UTC+05:30")
        cv2.putText(frame, f"{bop_name} | {cam_id}", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 2)
        cv2.putText(frame, ts_str, (15, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 200, 160), 1)

        # Top-right REC indicator
        blink = int(time.time() * 2) % 2 == 0
        rec_color = (0, 0, 255) if blink else (100, 100, 100)
        cv2.circle(frame, (self.width - 70, 22), 6, rec_color, -1)
        cv2.putText(frame, "LIVE REC", (self.width - 58, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)

        # Mode tag
        mode_text = "NIGHT-IR (ACTIVE)" if is_night else "HD-DAY VIS"
        cv2.putText(frame, mode_text, (self.width - 140, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 180, 180), 1)

    def _generate_night_crawl_frame(self, t: float) -> np.ndarray:
        """Simulates low-light border night outpost with crawling target crossing virtual tripwire."""
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        # Dark night background with terrain gradient
        for y in range(self.height):
            val = int(18 + (y / self.height) * 35)
            frame[y, :] = (val, int(val * 1.1), int(val * 1.05))

        # Distant border mountain silhouette
        for x in range(self.width):
            mount_h = int(120 + 25 * math.sin(x * 0.015) + 15 * math.cos(x * 0.03))
            frame[0:mount_h, x] = (10, 12, 12)

        # Border barbed-wire fence posts
        for post_x in range(40, self.width, 90):
            cv2.line(frame, (post_x, 210), (post_x, 340), (45, 50, 45), 3)
            # Barbed wire strands
            if post_x + 90 < self.width:
                for strand_y in [230, 265, 300, 335]:
                    cv2.line(frame, (post_x, strand_y), (post_x + 90, strand_y), (40, 45, 40), 1)

        # Crawling intruder moving horizontally across the lower field
        # Loop intruder every 14 seconds
        loop_t = (t % 14.0)
        target_x = int(60 + loop_t * 36)
        target_y = int(370 + 8 * math.sin(loop_t * 3))

        # Draw realistic crawling human figure (elongated horizontal body)
        # Torso
        cv2.ellipse(frame, (target_x, target_y), (38, 14), 8, 0, 360, (55, 60, 58), -1)
        # Head (low profile)
        head_x = target_x + 36
        head_y = target_y - 4
        cv2.circle(frame, (head_x, head_y), 11, (65, 70, 68), -1)
        # Limbs crawling
        arm_offset = int(10 * math.sin(loop_t * 6))
        cv2.line(frame, (target_x + 20, target_y + 4), (target_x + 35, target_y + 14 + arm_offset), (50, 55, 52), 4)
        cv2.line(frame, (target_x - 20, target_y + 2), (target_x - 38, target_y + 12 - arm_offset), (50, 55, 52), 4)

        # Add CCTV grain / IR sensor noise
        noise = np.random.normal(0, 4, (self.height, self.width, 3)).astype(np.int16)
        frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        self._draw_hud(frame, "BOP SECTOR ALPHA (POST-104)", "CAM-BOP-01", is_night=True)
        return frame

    def _generate_vehicle_anpr_frame(self, t: float) -> np.ndarray:
        """Simulates International Transit Checkpost with moving vehicles and clear license plates."""
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        # Sky and road backdrop
        frame[0:220, :] = (200, 185, 170)  # Daylight sky
        frame[220:self.height, :] = (65, 65, 65)  # Asphalt roadway

        # Road lane markings
        for y_dash in range(240, self.height, 45):
            cv2.line(frame, (self.width // 2, y_dash), (self.width // 2, y_dash + 25), (230, 230, 230), 4)

        # Checkpost boom barrier gate
        cv2.rectangle(frame, (30, 210), (70, 340), (40, 40, 140), -1)  # Post
        cv2.line(frame, (70, 250), (460, 250), (30, 30, 220), 8)  # Barrier arm
        for bx in range(90, 450, 40):
            cv2.line(frame, (bx, 246), (bx + 20, 254), (240, 240, 240), 6)

        # Moving Vehicle (SUV / Truck) approaching checkpoint
        loop_t = (t % 10.0)
        # Vehicle grows larger as it approaches
        veh_scale = 0.6 + (loop_t / 10.0) * 0.7
        veh_w = int(140 * veh_scale)
        veh_h = int(90 * veh_scale)
        veh_x = int((self.width // 2) - (veh_w // 2) + 20 * math.sin(loop_t))
        veh_y = int(230 + (loop_t / 10.0) * 160)

        # Vehicle Body
        cv2.rectangle(frame, (veh_x, veh_y), (veh_x + veh_w, veh_y + veh_h), (35, 45, 60), -1)
        # Windshield
        win_h = int(veh_h * 0.35)
        cv2.rectangle(
            frame,
            (veh_x + 10, veh_y + 8),
            (veh_x + veh_w - 10, veh_y + 8 + win_h),
            (140, 160, 170),
            -1
        )
        # Headlights
        cv2.circle(frame, (veh_x + 15, veh_y + veh_h - 18), int(8 * veh_scale), (100, 240, 255), -1)
        cv2.circle(frame, (veh_x + veh_w - 15, veh_y + veh_h - 18), int(8 * veh_scale), (100, 240, 255), -1)

        # License Plate (High contrast)
        plate_w = int(70 * veh_scale)
        plate_h = int(22 * veh_scale)
        plate_x = veh_x + (veh_w - plate_w) // 2
        plate_y = veh_y + veh_h - plate_h - 6

        cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (255, 255, 255), -1)
        cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (0, 0, 0), 2)
        font_scale = 0.35 * veh_scale
        cv2.putText(
            frame,
            "DL01AB1234",
            (plate_x + 4, plate_y + int(plate_h * 0.75)),
            cv2.FONT_HERSHEY_DUPLEX,
            font_scale,
            (0, 0, 0),
            1
        )

        self._draw_hud(frame, "BORDER CHECKPOST 7 - ROAD INGRESS", "CAM-CHK-02", is_night=False)
        return frame

    def _generate_loitering_frame(self, t: float) -> np.ndarray:
        """Simulates Zero Line Forward Watchtower with a human subject loitering in restricted perimeter."""
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        # Ground and sky
        frame[0:200, :] = (180, 195, 210)
        frame[200:self.height, :] = (85, 105, 90)  # Grassland buffer zone

        # Sentry tower legs in background
        cv2.line(frame, (520, 80), (480, 360), (70, 70, 70), 4)
        cv2.line(frame, (560, 80), (600, 360), (70, 70, 70), 4)
        cv2.rectangle(frame, (490, 60), (590, 120), (50, 50, 50), -1)

        # Standing / Loitering Person in Buffer Zone
        # Moves slowly back and forth within a confined perimeter area
        person_x = int(320 + 35 * math.sin(t * 0.5))
        person_y = 290
        p_w = 40
        p_h = 110

        # Body / Jacket
        cv2.rectangle(frame, (person_x, person_y), (person_x + p_w, person_y + p_h), (40, 50, 70), -1)
        # Head / Face
        cv2.circle(frame, (person_x + p_w // 2, person_y - 14), 16, (180, 200, 220), -1)
        # Legs
        cv2.line(frame, (person_x + 10, person_y + p_h), (person_x + 10, person_y + p_h + 35), (30, 30, 30), 5)
        cv2.line(frame, (person_x + 30, person_y + p_h), (person_x + 30, person_y + p_h + 35), (30, 30, 30), 5)

        self._draw_hud(frame, "WATCHTOWER 12 - BUFFER ZONE", "CAM-OUT-03", is_night=False)
        return frame

    def _generate_weapons_contraband_frame(self, t: float) -> np.ndarray:
        """Simulates an armed infiltration subject carrying a knife and dropping contraband luggage."""
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        # Terrain & Perimeter Fence
        frame[0:200, :] = (120, 130, 140)  # Overcast sky
        frame[200:self.height, :] = (60, 75, 60)  # Dense vegetation

        # Barbed fence
        for post_x in range(30, self.width, 80):
            cv2.line(frame, (post_x, 180), (post_x, 340), (50, 50, 50), 3)
            if post_x + 80 < self.width:
                for strand_y in [200, 240, 280, 320]:
                    cv2.line(frame, (post_x, strand_y), (post_x + 80, strand_y), (70, 70, 70), 1)

        # Intruder moving forward
        loop_t = (t % 12.0)
        person_x = int(100 + loop_t * 35)
        person_y = 260
        p_w = 45
        p_h = 120

        # Intruder Body (tactical gear)
        cv2.rectangle(frame, (person_x, person_y), (person_x + p_w, person_y + p_h), (35, 45, 35), -1)
        # Head / Mask
        cv2.circle(frame, (person_x + p_w // 2, person_y - 15), 18, (45, 55, 45), -1)

        # Contraband Tactical Backpack on back
        cv2.rectangle(frame, (person_x - 18, person_y + 10), (person_x - 2, person_y + 70), (20, 30, 20), -1)

        # Dropped Contraband Suitcase / Package on ground
        cv2.rectangle(frame, (180, 370), (240, 420), (30, 25, 45), -1)
        cv2.rectangle(frame, (180, 370), (240, 420), (180, 140, 60), 2)  # Suitcase trim

        # Drawn Knife / Weapon in hand
        hand_x = person_x + p_w + 10
        hand_y = person_y + 45
        # Knife Handle
        cv2.line(frame, (hand_x, hand_y), (hand_x + 12, hand_y - 8), (40, 25, 15), 4)
        # Steel Blade (Metallic Glint)
        cv2.line(frame, (hand_x + 12, hand_y - 8), (hand_x + 38, hand_y - 28), (230, 240, 255), 3)

        self._draw_hud(frame, "FORWARD SECTOR FOXTROT (ARMED SECTOR)", "CAM-WPN-04", is_night=False)
        return frame

    def _generate_riverine_boat_frame(self, t: float) -> np.ndarray:
        """Simulates riverine border sector with suspicious boat crossing international zero line."""
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        # Sky and River water
        frame[0:180, :] = (170, 190, 210)
        # Flowing water gradient
        for y in range(180, self.height):
            wv = int(90 + 20 * math.sin((y * 0.1) + t * 2))
            frame[y, :] = (wv + 40, wv + 20, wv)

        # Distant riverbank border trees
        for bx in range(0, self.width, 25):
            bh = int(140 + 15 * math.sin(bx * 0.1))
            cv2.circle(frame, (bx, bh), 20, (30, 65, 30), -1)

        # Moving Boat crossing river
        loop_t = (t % 14.0)
        boat_x = int(50 + loop_t * 38)
        boat_y = int(280 + 10 * math.sin(loop_t * 2))
        boat_w = 130
        boat_h = 35

        # Boat Hull
        pts = np.array([[boat_x, boat_y + boat_h],
                        [boat_x + boat_w, boat_y + boat_h],
                        [boat_x + boat_w + 20, boat_y],
                        [boat_x - 15, boat_y]], np.int32)
        cv2.fillPoly(frame, [pts], (40, 50, 65))
        # Cabin
        cv2.rectangle(frame, (boat_x + 30, boat_y - 25), (boat_x + 85, boat_y), (80, 95, 110), -1)
        # Wake in water
        cv2.line(frame, (boat_x - 20, boat_y + boat_h), (boat_x - 70, boat_y + boat_h + 15), (200, 220, 240), 2)

        self._draw_hud(frame, "RIVERINE SECTOR BRAVO (WATER BORDER)", "CAM-RIV-05", is_night=False)
        return frame

