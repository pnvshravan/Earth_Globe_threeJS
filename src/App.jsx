import './index.css'
import MaritimeGlobe from './versions/maritime-routes-globe.jsx';
import InteractiveGlobe from './versions/interactive-globe.jsx'
import MyGlobe from './versions/my-globe.jsx';

const App=() =>{
  return (
    <>
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <InteractiveGlobe/>
        {/* <MaritimeGlobe/> */}
        {/* <MyGlobe/> */}
      </div>
    </>
  );
}

export default App
