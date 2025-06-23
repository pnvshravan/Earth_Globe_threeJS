import React, { useState, useRef, useEffect, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import getStarfield from '../utils/getStarfield.js';
import pointTexture from '/assets/globe/point-32.png'; // Reference point image
import beamTexture from '/assets/globe/lightray-180.png'; // Light beam image


const InteractiveGlobe = () => {
    // State management
    const [hoverData, setHoverData] = useState(null);
    const globeEl = useRef(null);
    const [countries, setCountries] = useState({ features: [] });
    
    // Responsive sizing state
    const [globeSize, setGlobeSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Resize handler
    const handleResize = useCallback(() => {
        setGlobeSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
    }, []);

    // Add resize event listener
    useEffect(() => {
        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    // Fetch GeoJSON borders
    useEffect(() => {
        fetch('/geojson/ne_110m_land.json')
            .then(res => res.json())
            .then(data => setCountries(data))
            .catch(err => console.error('Error loading GeoJSON:', err));
    }, []);


    const pointsData = [        
        {
            lat: 40.7128,
            lng: -74.0060,
            city: 'New York',
            population: '8.4M',
            size: 1.5,
            color: '#ff5733',
            details: 'Largest city in the USA',
            image_url: '/assets/cities/newyork.jpg'
        },
        {
            lat: 51.5074,
            lng: -0.1278,
            city: 'London',
            population: '8.9M',
            size: 1.5,
            color: '#33ff57',
            details: 'Capital of England',
            image_url: '/assets/cities/london.jpg'
        },
        {
            lat: 35.6762,
            lng: 139.6503,
            city: 'Tokyo',
            population: '37M',
            size: 1.5,
            color: '#3357ff',
            details: 'Largest metropolitan area',
            image_url: '/assets/cities/tokyo.jpg'
        },
        {
            lat: 12.971599,
            lng: 77.594566,
            city: 'Bengaluru',
            population: '13M',
            size: 1.5,
            color: '#d5c82a',
            details: 'Silicon Valley of India',
            image_url: '/assets/cities/bengaluru.jpg'
        },
        {
            lat: 48.8575,
            lng: 2.3514,
            city: 'Paris',
            population: '2.1M',
            size: 1.5,
            color: '#ffffff',
            details: 'City of Love',
            image_url: '/assets/cities/paris.jpg'
        },
        {
            lat: 17.4065,
            lng: 78.4772,
            city: 'Hyderabad',
            population: '1M',
            size: 1.5,
            color: '#E1341E',
            details: 'Capital of Telangana',
            image_url: '/assets/cities/hyderabad.jpeg'
        },        
    ];

    const hoverTimeoutRef = useRef(null);
    const lastHoveredPointRef = useRef(null); // Store last hovered point

    const handlePointHover = useCallback((point) => {
    if (!globeEl.current) return;

    const controls = globeEl.current.controls();
    const globe = globeEl.current;

    if (!globe._initialState) {
        globe._initialState = {
        autoRotateSpeed: controls.autoRotateSpeed,
        dampingFactor: controls.dampingFactor,
        };
    }

    if (globe._animationFrame) {
        cancelAnimationFrame(globe._animationFrame);
        globe._animationFrame = null;
    }
    if (globe._resumeTimeout) {
        clearTimeout(globe._resumeTimeout);
        globe._resumeTimeout = null;
    }

    if (point) {
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0;
        controls.dampingFactor = 0.05;

        const ensureFullStop = () => {
        controls.update();
        const movement = controls.object.rotation.y;

        if (!globe._lastRotation) {
            globe._lastRotation = movement;
            globe._animationFrame = requestAnimationFrame(ensureFullStop);
            return;
        }

        if (Math.abs(movement - globe._lastRotation) > 0.00001) {
            globe._lastRotation = movement;
            globe._animationFrame = requestAnimationFrame(ensureFullStop);
        } else {
            controls.enabled = false;
            setTimeout(() => {
            controls.enabled = true;
            controls.autoRotate = false;
            }, 50);
        }
        };

        globe._animationFrame = requestAnimationFrame(ensureFullStop);

        // ✅ Prevent tooltip flickering by stabilizing the hover event
        if (lastHoveredPointRef.current !== point) {
        lastHoveredPointRef.current = point; // Store hovered point
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoverData(point);
        }, 150); // Slight delay to smooth transitions
        }

    } else {
        controls.enabled = true;
        controls.dampingFactor = globe._initialState.dampingFactor;

        globe._lastRotation = null;

        const startTime = Date.now();
        const resumeDuration = 1000;

        const smoothResume = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / resumeDuration, 1);
        const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const easedProgress = easeInOutCubic(progress);

        controls.autoRotate = true;
        controls.autoRotateSpeed = globe._initialState.autoRotateSpeed * easedProgress;
        controls.update();

        if (progress < 1) {
            globe._animationFrame = requestAnimationFrame(smoothResume);
        }
        };

        globe._resumeTimeout = setTimeout(() => {
        globe._animationFrame = requestAnimationFrame(smoothResume);
        }, 200);

        // ✅ Delay clearing hover state to prevent flickering on exit
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
        setHoverData(null);
        lastHoveredPointRef.current = null; // Reset last hovered point
        }, 250); // Delay clearing by 250ms for stability
    }

    document.body.style.cursor = point ? "pointer" : "default";
    }, []);

    useEffect(() => {
    return () => {
        if (globeEl.current) {
        if (globeEl.current._animationFrame) cancelAnimationFrame(globeEl.current._animationFrame);
        if (globeEl.current._resumeTimeout) clearTimeout(globeEl.current._resumeTimeout);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        }
    };
    }, []);

   
   
    // Initial setup
    useEffect(() => {
        if (globeEl.current) {
            const controls = globeEl.current.controls();
            

            controls.autoRotate = true;
            controls.autoRotateSpeed = 1;

            // Initial view positioning
            globeEl.current.pointOfView({
                lat: 25,
                lng: 0,
                altitude: 1.5
            }, 1000);

            const globe = globeEl.current;
            const scene = globe.scene();
            const camera = globeEl.current.camera()
            const globeCenter = new THREE.Vector3(0, 0, 0);

            const globeRadius = globe.getGlobeRadius();
            const ringCount = 3;
            const ringSpacing = 0.0007 * globeRadius;

            for (let i = 0; i < ringCount; i++) {
                const innerRadius = globeRadius * (1.05 + i * ringSpacing);
                const outerRadius = innerRadius + 0.002 * globeRadius;

                const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);
                
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 'rgb(30, 225, 149)', 
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });

                const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

                // Random orientation for each ring
                ringMesh.rotation.x = Math.random() * Math.PI;
                ringMesh.rotation.y = Math.random() * Math.PI;
                ringMesh.rotation.z = Math.random() * Math.PI;

                scene.add(ringMesh);
            }

            const stars = getStarfield({ numStars: 1500, fog: true });
            scene.add(stars); 

            

            pointsData.forEach(({ lat, lng, color, size }) => {
                const { x, y, z } = globeEl.current.getCoords(lat, lng);

                 /** POINT SPRITE **/
                const pointMaterial = new THREE.SpriteMaterial({
                    map: new THREE.TextureLoader().load(pointTexture),
                    color: color, 
                    transparent: true,
                    opacity: 1,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    size: size
                });

                const pointSprite = new THREE.Sprite(pointMaterial);
                pointSprite.scale.set(2, 2, 2);  

                // Move point slightly away from the globe to prevent overlap
                const pointOffset = new THREE.Vector3(x, y, z).normalize().multiplyScalar(1.5);
                pointSprite.position.set(x + pointOffset.x, y + pointOffset.y, z + pointOffset.z);

                // Rotate the point so it aligns with the globe's curvature
                pointSprite.lookAt(new THREE.Vector3(x, y, z).normalize().multiplyScalar(globeRadius + 10));

                scene.add(pointSprite);


                /** BEAM EFFECT **/
                const beamMaterial = new THREE.MeshBasicMaterial({
                    map: new THREE.TextureLoader().load(beamTexture),
                    transparent: true,
                    opacity: 1,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    color: color
                });

                const beamGeometry = new THREE.PlaneGeometry(2, 30);
                const beam = new THREE.Mesh(beamGeometry, beamMaterial);

                // Ensure beams don’t disappear when off-camera
                beam.frustumCulled = false;  // Prevent automatic culling (removal from scene)

                // Position the beam slightly above the point
                const beamOffset = new THREE.Vector3(x, y, z).normalize().multiplyScalar(1.7);
                beam.position.set(x + beamOffset.x, y + beamOffset.y, z + beamOffset.z);

                // Align beam perpendicularly to globe
                const beamDirection = new THREE.Vector3(x, y, z).sub(globeCenter).normalize();
                const upVector = new THREE.Vector3(0, 1, 0);
                beam.quaternion.setFromUnitVectors(upVector, beamDirection);

                scene.add(beam);
            });
        }
        
    }, []);

    return (
        <div style={{ 
            height: '100vh', 
            width: '100vw', 
            position: 'relative' 
        }}> 
            <Globe
                ref={globeEl}
                width={globeSize.width}
                height={globeSize.height}
                
               
                globeImageUrl={false}
                backgroundImageUrl={'/assets/globe/bg.jpg'}
                showGlobe={true}
                showGraticules={true}
                globeMaterial={new THREE.MeshBasicMaterial({
                    color: '#1e1e1e',
                    fog: true,
                    transparent: true,
                    opacity: 0.3
                })}
                
                hexPolygonsData={countries.features}
                hexPolygonUseDots={true}
                hexPolygonResolution={3}
                hexPolygonMargin={0.8}
                hexPolygonColor={() => 'rgb(30, 225, 149)'}
                

                polygonsData={countries.features}

                polygonStrokeColor={() => 'rgb(30, 225, 149)'}
                polygonAltitude={0.01}
                polygonCapColor = {() => 'transparent'}
                polygonSideColor = {() => 'transparent' }
                // // #5019e6 & #cf3047

                

                showAtmosphere={true}
                atmosphereColor={'rgb(30, 225, 149)'}
                atmosphereAltitude={0.2}
                
                pointsData={pointsData}
                pointLat="lat"
                pointLng="lng"
                pointLabel="city"
                
                pointRadius={point => point === hoverData ? point.size * 1.7 : point.size}
                pointColor={() =>'transparent'}
                // pointColor={point => point.color}
                pointAltitude={point => point === hoverData ? 0.15 : 0.1}
                // // pointAltitude={0.01}

                // pointAltitude={0.15}
                // pointRadius={2}
                pointMaterial={new THREE.PointsMaterial({
                    size: 2,
                    map: new THREE.TextureLoader().load(pointTexture),
                    transparent: true,
                })}
                
            
                onPointHover={handlePointHover}
                pointsMerge={false}
                
                enablePointerInteraction={true}
                autoRotate={true}
                autoRotateSpeed={0.5}
            />
            
            {/* Tooltip for hovered points */}
            {hoverData && (
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '20%',
                    background: '#202124',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontFamily:'monospace'
                }}>
                    <h3>{hoverData.city}</h3>
                    <p>Population: {hoverData.population}</p>
                    <p>{hoverData.details}</p>
                    <img src={hoverData.image_url} width={200} height={150} alt={hoverData.city}/>
                    
                </div>
            )}
        </div>
    );
};

export default InteractiveGlobe;
