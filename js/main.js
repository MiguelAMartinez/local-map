/* This interactive neighborhood map that uses JS Knockout, Google maps API, and a third party API 
to show my favorite restaurants in Austin
References used: Stack Overflow, Mozilla Developer Network, and W3Schools */

/*Model section: the data*/
var modelPlaces = [
	{
		name: 'Franklin Barbecue',
		website: 'https://franklinbarbecue.com',
		address: '900 E 11th St, Austin, TX',
		meals: ['x','Lunch','x']		
	}, {
		name: 'Hopdoddy Burger Bar',
		website: 'https://www.hopdoddy.com/',
		address: '1400 S Congress Ave, Austin, TX',
		meals: ['x','Lunch','Dinner']	
	}, {
		name: 'Torchys Tacos',
		website: 'http://torchystacos.com/',
		address: '2801 Guadalupe St, Austin, TX',
		meals: ['Breakfast','Lunch','Dinner']	
	}, {
		name: 'Uchi',
		website: 'http://uchiaustin.com/',
		address: '801 South Lamar Boulevard, Austin, TX',
		meals: ['x','x','Dinner']
	}, {
		name: 'Moonshine Grill',
		website: 'http://moonshinegrill.com/',
		address: '303 Red River St, Austin, TX',
		meals: ['x','Lunch','Dinner']
	}, {
		name: 'Tacodeli',
		website: 'http://tacodeli.com/',
		address: '4200 N Lamar Blvd, Austin, TX',
		meals: ['Breakfast','Lunch','x']
	}, {
		name: 'Kerbey Lane Cafe',
		website: 'http://kerbeylanecafe.com/',
		address: '2606 Guadalupe St, Austin, TX',
		meals: ['Breakfast','Lunch','Dinner']
	}, {
		name: 'Eastside Cafe',
		website: 'http://eastsidecafeaustin.com',
		address: '2113 Manor Rd, Austin, TX',
		meals: ['x','Lunch','Dinner']
	}
];

var modelMeals = [
	{
		mealType: 'Breakfast', 
		filterCheck: '[X]'
	}, {
		mealType: 'Lunch', 
		filterCheck: '[X]'
	}, {
		mealType: 'Dinner',
		filterCheck: '[X]'
	}		
];

/*Define important variables*/
var selectedMeals = ['Breakfast','Lunch','Dinner'];
var currentIW;
var defaultIcon;
var overIcon;
var map;
var flickrURL = "http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";

/*Make the first iteration of the Google map*/
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 30.267153, lng: -97.74306079999999},
		zoom: 13
	});

	defaultIcon = makeMarkerIcon('fe7569');
	overIcon = makeMarkerIcon('0091ff');

	var geocoder = new google.maps.Geocoder();
	var largeInfowindow = new google.maps.InfoWindow();
	var markers = [];
	/*Create markers*/
	modelPlaces.forEach(function(place){
		geocoder.geocode(
			{address: place.address},
			function(results, status) {
		    	if (status == google.maps.GeocoderStatus.OK) {
			        map.setCenter(results[0].geometry.location);
			        place.marker = new google.maps.Marker({
			            map: map,
			            title: place.name,
			            position: results[0].geometry.location
			        });
			        /*Infowindow opens when a marker is clicked*/
	    			place.marker.addListener('click', function() {
	        			ViewInfoWindow(place, largeInfowindow);
	        			this.setIcon(overIcon);
	    			});
		    	} else {
		        	alert("Geocode was not successful for the following reason: " + status);
		      	}
	        }
	    );   
	});
}

/*The meal filter and restaurant places constructors*/ 
function constrPlace(place) {
	this.placeName = ko.observable(place.name);
	this.placeWebsite = ko.observable(place.website);
	this.placeAddress = ko.observable(place.address);
	this.placeMeals = ko.observableArray(place.meals);
}

function constrMeal(data) {
	this.mealName = ko.observable(data.mealType);
	this.filterText = ko.observable(data.filterCheck);
}

/*Connect the user view with the data models*/
function ViewModel() {
	var self = this;

	this.mealList = ko.observableArray([]);

	modelMeals.forEach(function(meal){
		self.mealList.push( new constrMeal(meal) );
	});

	this.placeList = ko.observableArray([]);

	modelPlaces.forEach(function(place){
		self.placeList.push( new constrPlace(place) );
	});

	this.mealFilter = function(meal) {
		if (meal.filterText() === '[X]') {
			var index = selectedMeals.indexOf(meal.mealName());
			selectedMeals[index] = 'no' + meal.mealName();
			meal.filterText('[ ]');		
		} else {
			meal.filterText('[X]');
			var index = selectedMeals.indexOf('no' + meal.mealName());
			selectedMeals[index] = meal.mealName();
		}
		updateViewList(self);
	};	

	this.listClick = function(aplace) {
		var nameaplace = aplace.placeName();
		for (i = 0; i < modelPlaces.length; i++) {
			if (modelPlaces[i].name == nameaplace) {
				var largeInfowindow = new google.maps.InfoWindow();
				ViewInfoWindow(modelPlaces[i], largeInfowindow);
				modelPlaces[i].marker.setIcon(overIcon);
			}
		}
	}
}

/*Change color of markers*/
function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage(
	  'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
	  '|40|_|%E2%80%A2',
	  new google.maps.Size(21, 34),
	  new google.maps.Point(0, 0),
	  new google.maps.Point(10, 34),
	  new google.maps.Size(21,34));
	return markerImage;
}


/*Create new infowindow and clear previous ones
Use Flickr API to get images about each food place*/
function ViewInfoWindow(place, infowindow) {
	modelPlaces.forEach(function(place){
		place.marker.setIcon(defaultIcon);
	});

	if (currentIW) {
    	currentIW.close();		
	}

	/*Message in case API request fails*/
	var flickrRequestTimeout = setTimeout(function() {
    	$(".images").text("Failed to get Flickr Images");
	}, 8000);

	$.getJSON( flickrURL, {
			tags: place.name,
			tagmode: "any",
			format: "json"
		}).done(function( data ) {
			$.each( data.items, function( i, item ) {
				$( "<img>" ).attr( "src", item.media.m ).appendTo( ".images" );
				if ( i === 12 ) {
				  return false;
				}
			});
			clearTimeout(flickrRequestTimeout);
	});

	if (infowindow.marker != place.marker) {

		infowindow.marker = place.marker;
		var newcontent = '<h2 class="title-infoW">' + place.marker.title + '</h2><p class="sub-infoW">' + place.address + '</p><br><div class="img-container"><div class="images"></div></div>';
		infowindow.setContent(newcontent);
		currentIW = infowindow;
		infowindow.open(map, place.marker);
		infowindow.addListener('closeclick',function(){
			infowindow.marker = null;
			place.marker.setIcon(defaultIcon);
		});
	}
}

/*Update map after meal filter*/
function updateViewList(self) {
	self.placeList.removeAll(); 
	modelPlaces.forEach(function(place){
		if (place.meals[0] === selectedMeals[0]) {
			place.marker.setMap(map);
			self.placeList.push( new constrPlace(place) );
		} else if (place.meals[1] === selectedMeals[1]) {
			place.marker.setMap(map);
			self.placeList.push( new constrPlace(place) );
		} else if (place.meals[2] === selectedMeals[2]) {
			place.marker.setMap(map);
			self.placeList.push( new constrPlace(place) );
		} else {
			place.marker.setMap(null);			
		}
	});
}


ko.applyBindings(new ViewModel())