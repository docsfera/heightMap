const int MAX_CURVE_POINTS = 1000; // Adjust as needed

vec3 catmullRomSegment(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;

    float b0 = -0.5 * t3 + t2 - 0.5 * t;
    float b1 =  1.5 * t3 - 2.5 * t2 + 1.0;
    float b2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
    float b3 =  0.5 * t3 - 0.5 * t2;

    return p0 * b0 + p1 * b1 + p2 * b2 + p3 * b3;
}

vec3 catmullRomTangentSegment(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float t2 = t * t;

    float b0 = -1.5 * t2 + 2.0 * t - 0.5;
    float b1 =  4.5 * t2 - 5.0 * t;
    float b2 = -4.5 * t2 + 4.0 * t + 0.5;
    float b3 =  1.5 * t2 - 1.0 * t;

    return p0 * b0 + p1 * b1 + p2 * b2 + p3 * b3;
}

vec3 catmullRomCurve(vec3 points[MAX_CURVE_POINTS], int pointsLength, float t) {
    // Determine the segment index
    float segment = t * float(pointsLength - 3); // `pointsLength - 3` because we need 4 points per segment
    int i = int(segment); // Segment index
    float localT = segment - float(i); // Local t within the segment

    // Clamp i to be within valid range
    i = clamp(i, 0, pointsLength - 4);

    // Get the four control points for the segment
    vec3 p0 = points[i];
    vec3 p1 = points[i + 1];
    vec3 p2 = points[i + 2];
    vec3 p3 = points[i + 3];

    // Evaluate the segment
    return catmullRomSegment(p0, p1, p2, p3, localT);
}

vec3 getCatmullRomTangent(vec3 points[MAX_CURVE_POINTS], int pointsLength, float t) {
    // Determine the segment index
    float segment = t * float(pointsLength - 3); // `pointsLength - 3` because we need 4 points per segment
    int i = int(segment); // Segment index
    float localT = segment - float(i); // Local t within the segment

    // Clamp i to be within valid range
    i = clamp(i, 0, pointsLength - 4);

    // Get the four control points for the segment
    vec3 p0 = points[i];
    vec3 p1 = points[i + 1];
    vec3 p2 = points[i + 2];
    vec3 p3 = points[i + 3];

    // Evaluate the tangent of the segment
    return normalize(catmullRomTangentSegment(p0, p1, p2, p3, localT));
}

vec3 getCatmullRomNormal(vec3 points[MAX_CURVE_POINTS], int pointsLength, float t) {
    vec3 tangent = getCatmullRomTangent(points, pointsLength, t);
    vec3 up = vec3(0.0, 1.0, 0.0);
    return normalize(cross(up, tangent));
}
