package com.smartcampus.smart_campus_api.model;

import lombok.Data;

@Data
public class AvailabilityWindow {
    private String dayOfWeek;
    private String startTime;
    private String endTime;
}
