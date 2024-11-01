import React from "react";
import useLocation from "./useLocation"; // Import the hook

const LocationComponent = () => {
  const { location, error, getLocation } = useLocation();

  return (
    <div>
      <h1>Allow Location Access</h1>
      <button onClick={getLocation}>Get My Location</button>

      {location.latitude && location.longitude ? (
        <p>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </p>
      ) : (
        <p>No location data available yet.</p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default LocationComponent;
