/* eslint-disable*/

//sconst e = require("express");




export const displayMap = (locations) => {

    mapboxgl.accessToken = 'pk.eyJ1Ijoia2FyYW4yMDAwIiwiYSI6ImNrOW14OXFoZDA4a3ozZm50YjlxemE2bmgifQ.L9eyiHSSxPIYvncQf9IwFg';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/karan2000/ck9mxl5r028iz1immisfmm5gw',
        scrollZoom: false
        //center: [22.911, 85.081],
        //zoom: 3.86
    });
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => {
        //create marker
        const el = document.createElement('div')
        el.className = 'marker';
        //add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day} : ${loc.description} $</p>`).addTo(map)
        //extends map bounds to include current location
        bounds.extend(loc.coordinates)
    });
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });

}