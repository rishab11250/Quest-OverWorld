/**
 * Determines current overworld ambient atmosphere based on local time.
 */
export const getTimeOfDayAtmosphere = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 9) {
    return {
      period: 'dawn',
      title: 'DAWN EXPEDITION',
      subtitle: 'First Light Over Campus Quad',
      accentColor: '#F5A623',
      bgTint: '#1B1428',
      weatherIcon: 'weather-sunset-up',
      tag: '🌄 DAWN HOUR',
    };
  } else if (hour >= 9 && hour < 17) {
    return {
      period: 'day',
      title: 'HIGH NOON REALM',
      subtitle: 'Sun High Above Old Quad',
      accentColor: '#F2C84B',
      bgTint: '#151126',
      weatherIcon: 'weather-sunny',
      tag: '☀️ SOLAR EXPEDITION',
    };
  } else if (hour >= 17 && hour < 20) {
    return {
      period: 'dusk',
      title: 'TWILIGHT REALM',
      subtitle: 'Shadows Lengthen Across Landmark Steps',
      accentColor: '#E8664B',
      bgTint: '#181024',
      weatherIcon: 'weather-sunset-down',
      tag: '🌆 TWILIGHT HOUR',
    };
  } else {
    return {
      period: 'night',
      title: 'MIDNIGHT EXPEDITION',
      subtitle: 'Starlight Illuminates Ancient Waypoints',
      accentColor: '#9B51E0',
      bgTint: '#0F0C1C',
      weatherIcon: 'weather-night',
      tag: '🌙 MIDNIGHT HUNT',
    };
  }
};

export default getTimeOfDayAtmosphere;
