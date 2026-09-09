"""
IBVAP - Virtual Fence & Polygonal Tripwire Spatial Intrusion Engine
Provides ray-casting point-in-polygon checks and line-segment intersection tests
to detect unauthorized breach of border perimeters and exclusion buffer zones.
"""
from typing import List, Tuple, Optional
import numpy as np


class VirtualFenceEngine:
    @staticmethod
    def is_point_in_polygon(point: Tuple[float, float], polygon: List[List[float]]) -> bool:
        """
        Ray-casting algorithm to check if a 2D point (x, y) is inside a polygon.
        Polygon is a list of points: [[x1, y1], [x2, y2], ...]
        """
        if len(polygon) < 3:
            return False

        x, y = point
        n = len(polygon)
        inside = False

        p1x, p1y = polygon[0]
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y

        return inside

    @staticmethod
    def _ccw(A: Tuple[float, float], B: Tuple[float, float], C: Tuple[float, float]) -> bool:
        """Counter-clockwise orientation test."""
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

    @classmethod
    def do_intersect(
        cls,
        p1: Tuple[float, float],
        q1: Tuple[float, float],
        p2: Tuple[float, float],
        q2: Tuple[float, float]
    ) -> bool:
        """
        Checks if line segment p1-q1 (trajectory) intersects segment p2-q2 (tripwire).
        """
        return (
            cls._ccw(p1, p2, q2) != cls._ccw(q1, p2, q2) and
            cls._ccw(p1, q1, p2) != cls._ccw(p1, q1, q2)
        )

    @classmethod
    def check_tripwire_crossing(
        cls,
        prev_pos: Tuple[float, float],
        curr_pos: Tuple[float, float],
        tripwire_pts: List[List[float]],
        direction: str = "bidirectional"
    ) -> bool:
        """
        Detects if a target crossed the virtual tripwire line between prev_pos and curr_pos.
        """
        if len(tripwire_pts) < 2:
            return False

        line_p1 = tuple(tripwire_pts[0])
        line_p2 = tuple(tripwire_pts[1])

        intersects = cls.do_intersect(prev_pos, curr_pos, line_p1, line_p2)
        if not intersects:
            return False

        if direction == "bidirectional":
            return True

        # Directional test using vector cross product
        wire_vec = (line_p2[0] - line_p1[0], line_p2[1] - line_p1[1])
        move_vec = (curr_pos[0] - prev_pos[0], curr_pos[1] - prev_pos[1])
        cross = wire_vec[0] * move_vec[1] - wire_vec[1] * move_vec[0]

        if direction == "forward" and cross > 0:
            return True
        elif direction == "backward" and cross < 0:
            return True

        return direction == "bidirectional"

    @staticmethod
    def get_ground_anchor(bbox: List[float]) -> Tuple[float, float]:
        """
        Calculates the bottom-center anchor point (feet / ground contact) of a target bounding box.
        bbox = [x1, y1, x2, y2]
        """
        x1, y1, x2, y2 = bbox
        center_x = (x1 + x2) / 2.0
        ground_y = float(y2)
        return (center_x, ground_y)
