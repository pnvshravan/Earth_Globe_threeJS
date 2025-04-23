// First, install the package:
// npm install react-globe.gl

import React from 'react';
import Globe from 'react-globe.gl';

const MyGlobe = () => {
    // Sample data for points on the globe
    const markerData = [
        {
            lat: 40.7128,
            lng: -74.0060,
            size: 0.5,
            color: 'red',
            label: 'New York'
        },
        {
            lat: 51.5074,
            lng: -0.1278,
            size: 0.5,
            color: 'blue',
            label: 'London'
        }
    ];

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <Globe
                // Basic globe configuration
                globeImageUrl="https://unpkg.com/three-globe@2.41.12/example/img/earth-dark.jpg"
                backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
                width={1920}
                height={1080}


                // Point data configuration
                pointsData={markerData}
                pointLat="lat"
                pointLng="lng"
                pointColor="color"
                pointLabel="label"
                pointRadius="size"
                
                // Interactive features
                pointAltitude={0.1}
                pointsTransitionDuration={1000}
                
                // Camera settings
                cameraRotateSpeed={0.5}
                cameraDistanceRadiusScale={3}
                enablePointerInteraction={true}
            />
        </div>
    );
};

export default MyGlobe;