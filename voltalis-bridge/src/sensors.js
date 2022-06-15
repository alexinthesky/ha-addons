module.exports = (hass) => {
  hass.registerSensor('voltalis_immediate_consumption', {
    friendly_name: 'Voltalis Immediate Consumptio (kW)',
    icon: 'mdi:home-lightning-bolt-outline',
    unit_of_measurement: 'W',
    device_class: 'power',
    state_class: 'total_increasing'
  });

  hass.registerSensor('voltalis_consumption', {
    friendly_name: 'Voltalis Consumption (kWh)',
    icon: 'mdi:home-lightning-bolt-outline',
    unit_of_measurement: 'Wh',
    device_class: 'energy',
    state_class: 'total_increasing'
  });

  return hass.sensors;
}