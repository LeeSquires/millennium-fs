import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: 'AIzaSyBSgmItIIkt7rADqH3GMEwVkAledYFipzw',
  version: 'weekly',
  libraries: ['places', 'geometry'],
});

loader.load().then(() => {
  const map = new google.maps.Map(document.getElementById('map-target') as HTMLElement, {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });

  const form = document.getElementById('get-quote-form') as HTMLFormElement;

  // add autocomplete to the pick-up and deliver to fields
  const pickup = document.getElementById('direct-from') as HTMLInputElement;
  const deliver = document.getElementById('direct-to') as HTMLInputElement;

  const options = {
    fields: ['geometry', 'place_id'],
    types: ['geocode'],
    componentRestrictions: { country: 'gb' },
  };

  const pickupAutocomplete = new google.maps.places.Autocomplete(pickup, options);
  const deliveryAutocomplete = new google.maps.places.Autocomplete(deliver, options);

  // Check when form is submitted
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const pickupPlace = pickupAutocomplete.getPlace();
    const deliveryPlace = deliveryAutocomplete.getPlace();

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [pickupPlace.geometry?.location],
        destinations: [deliveryPlace.geometry?.location],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      },
      callback
    );

    function callback(response, status) {
      if (status == 'OK') {
        const origins = response.originAddresses;
        const destinations = response.destinationAddresses;

        for (let i = 0; i < origins.length; i++) {
          const results = response.rows[i].elements;
          for (let j = 0; j < results.length; j++) {
            const element = results[j];
            const distance = element.distance.text;
            const duration = element.duration.text;
            const from = origins[i];
            const to = destinations[j];

            const result = document.getElementById('distance') as HTMLElement;
            result.innerHTML = 'Distance: ' + distance;
          }
        }
      }
    }
  });
});
