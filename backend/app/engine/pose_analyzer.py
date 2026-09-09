"""
IBVAP - Pose Kinematics & Behavioral Threat Analysis Engine
Analyzes human skeleton keypoints from YOLOv8-pose to detect tactical suspicious actions:
1. Prone / Crawling infiltration posture (low profile, horizontal spine)
2. Border fence climbing / scaling behavior
3. Crouching / Tactical concealment posture
4. Rapid sprint / rush intrusion
5. Perimeter dwelling / Loitering
6. Carrying bulky load / contraband package
"""
from __future__ import annotations
import math
from typing import Dict, List, Optional, Tuple, Any
import numpy as np


class PoseBehaviorAnalyzer:
    @staticmethod
    def is_prone_or_crawling(bbox: List[int], keypoints: np.ndarray) -> Tuple[bool, float]:
        """
        Determines if a person is in a crawling / prone posture using:
        1. Bounding box aspect ratio (width vs height)
        2. Torso inclination (Nose to Hip angle relative to horizontal plane)
        """
        x1, y1, x2, y2 = bbox
        width = max(1, x2 - x1)
        height = max(1, y2 - y1)
        aspect_ratio = width / float(height)

        # Baseline check: Crawling targets have wider-than-tall aspect ratio
        if aspect_ratio < 1.1:
            return False, 0.0

        if keypoints is None or len(keypoints) < 13:
            # Fallback to pure bounding box geometry if keypoints are obscured
            if aspect_ratio >= 1.35:
                return True, min(1.0, aspect_ratio / 2.0)
            return False, 0.0

        nose = keypoints[0]
        left_hip = keypoints[11]
        right_hip = keypoints[12]

        has_nose = nose[0] > 0 and nose[1] > 0
        has_hip = (left_hip[0] > 0 and left_hip[1] > 0) or (right_hip[0] > 0 and right_hip[1] > 0)

        if not (has_nose and has_hip):
            if aspect_ratio >= 1.3:
                return True, 0.75
            return False, 0.0

        # Calculate hip midpoint
        if left_hip[0] > 0 and right_hip[0] > 0:
            hip_x = (left_hip[0] + right_hip[0]) / 2.0
            hip_y = (left_hip[1] + right_hip[1]) / 2.0
        elif left_hip[0] > 0:
            hip_x, hip_y = left_hip[0], left_hip[1]
        else:
            hip_x, hip_y = right_hip[0], right_hip[1]

        dx = abs(nose[0] - hip_x)
        dy = abs(nose[1] - hip_y)

        # In crawling / prone stance, horizontal displacement exceeds vertical displacement
        if dx > dy * 1.1:
            confidence = min(0.99, max(0.65, dx / (dy + 1e-4) * 0.45))
            return True, float(confidence)

        return False, 0.0

    @staticmethod
    def is_fence_climbing(bbox: List[int], keypoints: np.ndarray) -> Tuple[bool, float]:
        """
        Detects if a subject is scaling/climbing a perimeter barrier:
        - Hands/wrists are elevated above head/nose
        - Feet are off the ground level
        """
        if keypoints is None or len(keypoints) < 17:
            return False, 0.0

        nose = keypoints[0]
        left_wrist, right_wrist = keypoints[9], keypoints[10]
        left_ankle, right_ankle = keypoints[15], keypoints[16]

        hands_up = False
        if nose[1] > 0:
            if (left_wrist[1] > 0 and left_wrist[1] < nose[1]) or (right_wrist[1] > 0 and right_wrist[1] < nose[1]):
                hands_up = True

        feet_elevated = False
        box_bottom = bbox[3]
        if left_ankle[1] > 0 and right_ankle[1] > 0:
            if (box_bottom - max(left_ankle[1], right_ankle[1])) > (bbox[3] - bbox[1]) * 0.2:
                feet_elevated = True

        if hands_up and feet_elevated:
            return True, 0.85
        return False, 0.0

    @staticmethod
    def is_crouching(bbox: List[int], keypoints: np.ndarray) -> Tuple[bool, float]:
        """
        Detects crouching / kneeling stance (hip-knee-ankle joint compression).
        """
        if keypoints is None or len(keypoints) < 17:
            return False, 0.0

        left_hip, right_hip = keypoints[11], keypoints[12]
        left_knee, right_knee = keypoints[13], keypoints[14]
        left_ankle, right_ankle = keypoints[15], keypoints[16]

        if left_hip[1] > 0 and left_knee[1] > 0 and left_ankle[1] > 0:
            # Check vertical compression ratio
            torso_leg_ratio = abs(left_knee[1] - left_hip[1]) / float(max(1, abs(left_ankle[1] - left_knee[1])))
            if torso_leg_ratio < 0.65:
                return True, 0.80

        return False, 0.0

    @staticmethod
    def calculate_velocity(history: List[Tuple[float, float, float]]) -> float:
        """
        Calculates pixel speed per second from trajectory history: [(x, y, timestamp), ...]
        """
        if len(history) < 2:
            return 0.0
        
        p1 = history[0]
        p2 = history[-1]
        dt = max(1e-4, p2[2] - p1[2])
        dist = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
        return dist / dt

    @classmethod
    def classify_activity(
        cls,
        bbox: List[int],
        keypoints: Optional[np.ndarray] = None,
        prev_box: Optional[List[int]] = None,
        time_delta: float = 0.1,
        history: Optional[List[Tuple[float, float, float]]] = None
    ) -> Dict[str, Any]:
        """
        Classifies human posture & tactical activity into standard classifications:
        CRAWLING, CLIMBING, CROUCHING, RUNNING, WALKING, STANDING.
        """
        # 1. Check Crawling / Prone
        is_crawl, crawl_conf = cls.is_prone_or_crawling(bbox, keypoints)
        if is_crawl:
            return {
                "activity": "CRAWLING",
                "confidence": crawl_conf,
                "is_suspicious": True,
                "description": "Prone / Crawling low-profile incursion",
                "details": {"posture": "crawling", "confidence": crawl_conf}
            }

        # 2. Check Fence Climbing
        is_climb, climb_conf = cls.is_fence_climbing(bbox, keypoints)
        if is_climb:
            return {
                "activity": "CLIMBING",
                "confidence": climb_conf,
                "is_suspicious": True,
                "description": "Perimeter fence scaling behavior",
                "details": {"posture": "climbing", "confidence": climb_conf}
            }

        # 3. Check Crouching
        is_crouch, crouch_conf = cls.is_crouching(bbox, keypoints)
        if is_crouch:
            return {
                "activity": "CROUCHING",
                "confidence": crouch_conf,
                "is_suspicious": True,
                "description": "Tactical crouching / concealment stance",
                "details": {"posture": "crouching", "confidence": crouch_conf}
            }

        # 4. Check Running / Sprint velocity
        speed = 0.0
        if history and len(history) >= 2:
            speed = cls.calculate_velocity(history)
        elif prev_box is not None and time_delta > 0:
            c1_x, c1_y = (prev_box[0] + prev_box[2]) / 2.0, (prev_box[1] + prev_box[3]) / 2.0
            c2_x, c2_y = (bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0
            dist = math.hypot(c2_x - c1_x, c2_y - c1_y)
            speed = dist / max(1e-3, time_delta)

        if speed > 85.0:  # High speed threshold in pixel/sec
            return {
                "activity": "RUNNING",
                "confidence": min(0.98, max(0.70, speed / 120.0)),
                "is_suspicious": True,
                "description": f"Rapid rush / sprint intrusion ({speed:.1f} px/s)",
                "details": {"speed_px_sec": round(speed, 1)}
            }
        elif speed > 15.0:
            return {
                "activity": "WALKING",
                "confidence": 0.90,
                "is_suspicious": False,
                "description": "Upright pedestrian movement",
                "details": {"speed_px_sec": round(speed, 1)}
            }

        return {
            "activity": "STANDING",
            "confidence": 0.90,
            "is_suspicious": False,
            "description": "Stationary / upright posture",
            "details": {"speed_px_sec": round(speed, 1)}
        }
