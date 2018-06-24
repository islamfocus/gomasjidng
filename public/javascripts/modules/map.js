import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat = 9.0579, lng = 7.4951 },
  zoom: 10
};


function loadPlaces(map, lat = 9.0579, lng = 7.4951	) {
    axios.get(`/api/masajid/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if (!places.length) {
        alert('SubhanalLah! no masjid was found!');
        return;
      };

      const arrow = document.querySelector('/.arrow');
      const speed = document.querySelector('/.speed-value');
      
      navigator.geolocation.getCurrentPosition((data) => {
        console.log(data);
        speed.textContent = data.coords.speed;
        arrow.style.transform = `rotate(${data.coords.heading}deg)`;
      }, (err) => {
        console.error(err);
      });

      // create a bounds
      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });

      // when someone clicks on a marker, show the details of that place
      markers.forEach(marker => marker.addListener('click', function() {
        console.log(this.place);
        const html = `
          <div class="popup">
            <a href="/masjid/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address} - ${this.place.imam_name} - ${this.place.imam_phone_no}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }));

      // then zoom the map to fit all the markers perfectly
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });

}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;
