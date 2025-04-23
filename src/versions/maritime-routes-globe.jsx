import React, { useState, useEffect, useCallback } from 'react';
import Globe from 'react-globe.gl';

// Helper function to validate coordinates
const isValidCoordinate = (coord) => {
  return coord && 
         typeof coord.lat === 'number' && 
         typeof coord.lng === 'number' && 
         !isNaN(coord.lat) && 
         !isNaN(coord.lng) &&
         coord.lat >= -90 && 
         coord.lat <= 90 && 
         coord.lng >= -180 && 
         coord.lng <= 180;
};

// Helper function to parse location strings
const parseLocation = (locationStr) => {
  try {
    // Handle direct coordinate objects
    if (typeof locationStr === 'object' && locationStr.lat !== undefined) {
      const coord = {
        lat: Number(locationStr.lat),
        lng: Number(locationStr.lon || locationStr.lng)
      };
      return isValidCoordinate(coord) ? coord : null;
    }

    // Handle string format
    const parts = locationStr.match(/(\d+)°(\d+)'(\d+)"([NS]).,\s*(\d+)°(\d+)'(\d+)"([EW])/);
    if (!parts) {
      console.warn('Location string did not match expected format:', locationStr);
      return null;
    }

    let lat = parseInt(parts[1]) + parseInt(parts[2])/60 + parseInt(parts[3])/3600;
    if (parts[4] === 'S') lat = -lat;

    let lng = parseInt(parts[5]) + parseInt(parts[6])/60 + parseInt(parts[7])/3600;
    if (parts[8] === 'W') lng = -lng;

    const coord = { lat, lng };
    return isValidCoordinate(coord) ? coord : null;
  } catch (e) {
    console.warn('Error parsing location:', locationStr, e);
    return null;
  }
};

const MaritimeGlobe = () => {
  const [routePaths, setRoutePaths] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   // Responsive sizing state
   const [globeSize, setGlobeSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  // const globeEl = useRef(null);
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
  

  // Define colors with better visibility
  const colors = {
    portToPort: '#F3F3F3', // Grey color for port-to-port routes -  #F3F3F3
    port: '#FF4444', // Bright red for ports - #FF4444    
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [portsResponse] = await Promise.all([
          fetch('src/utils/geojson/PUB151_distances.json'),
        ]);

        const portsData = await portsResponse.json();

        const portsList = [];
        const routes = [];

        // Process ports and routes
        Object.entries(portsData).forEach(([portName, portData]) => {
          const portCoords = parseLocation(portData.location);
          if (!portCoords) return;

          portsList.push({
            name: portName,
            lat: portCoords.lat,
            lng: portCoords.lng,
            type: 'port'
          });


          // Process destination routes
          if (portData.destinations) {
            Object.entries(portData.destinations).forEach(([destPort, distance]) => {
              const destCoords = parseLocation(portsData[destPort]?.location);
              if (destCoords && isValidCoordinate(destCoords)) {
                routes.push({
                  startLat: portCoords.lat,
                  startLng: portCoords.lng,
                  endLat: destCoords.lat,
                  endLng: destCoords.lng,
                  distance: parseFloat(distance),
                  type: 'port-port',
                  label: `${portName} to ${destPort}`
                });
              }
            });
          }
        });

        // Set points and validate routes before converting to paths
        setPoints([...portsList]);
        
        const validRoutes = routes.filter(route => 
          !isNaN(route.startLat) && !isNaN(route.startLng) && 
          !isNaN(route.endLat) && !isNaN(route.endLng)
        );

        setRoutePaths(validRoutes.map(route => ({
          coords: [
            [route.startLng, route.startLat],
            [route.endLng, route.endLat]
          ],
          properties: {
            distance: route.distance,
            type: route.type,
            label: route.label,
            color: route.type === 'port-port' ? colors.portToPort : colors.portToJunction
          }
        })));

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading maritime data...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error}</div>;
  }


  const legendStyle = {
    position: 'absolute',
    bottom: '1rem',
    left: '1rem',
    backgroundColor: '#202124',
    padding: '1rem',
    borderRadius: '0.5rem',
    color: 'white',
    zIndex: 1000,  // This ensures the legend appears above the globe
  };

  const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  };

  const dotStyle = {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
  };

  const lineStyle = {
    width: '32px',
    height: '8px',
  };


  return (
    <div className="relative h-screen w-full">
      <Globe
        // ref={globeEl}
        width={globeSize.width}
        height={globeSize.height}

        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
        pathsData={routePaths}
        pathPoints="coords"
        pathPointLat={p => p[1]}
        pathPointLng={p => p[0]}
        pathColor={path => path.properties.color}
        pathLabel={path => `${path.properties.label}: ${path.properties.distance} nautical miles`}
        pathDashLength={0.1}
        pathDashGap={0.008}
        pathDashAnimateTime={12000}
        pathStroke={1} // Increased stroke width for better visibility -> 3
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor={point => point.type === 'port' ? colors.port : colors.junction}
        pointRadius={point => point.type === 'port' ? 0.5 : 0.3}
        pointLabel={point => `${point.name} (${point.type})`}
        pointAltitude={0.01}
      />
      <div style={legendStyle}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Legend
        </h3>
        <div>
          <div style={legendItemStyle}>
            <div style={{ ...dotStyle, backgroundColor: colors.port }}></div>
            <span>Ports</span>
          </div>
          
          <div style={legendItemStyle}>
            <div style={{ ...lineStyle, backgroundColor: colors.portToPort }}></div>
            <span>Port-to-Port Routes</span>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default MaritimeGlobe;