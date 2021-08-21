var currLocation;
window.addEventListener('load', fetchUserCurrentlocation())

function fetchUserCurrentlocation() {
   
    intializeUIElements();
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
      };

    fetch("https://ipinfo.io/json?token=b42e020c1b42a3", requestOptions)
    .then(response => response.json())
    .then(result => currLocation = result.loc,
    document.getElementById("submitButton").disabled = false
    )
    .catch(error => console.log('error', error));
}

function intializeUIElements() {
    document.getElementById("submitButton").disabled = true
    document.getElementById("hereButton").checked = true
    document.getElementById("locationButton").checked = false;
    document.getElementById('locationText').required = false;
    document.getElementById('locationText').disabled = true;
    document.getElementById('locationText').placeholder = "location";
}

function hereRadioButtonClicked() {
    document.getElementById("hereButton").checked = true;
    document.getElementById("locationButton").checked = false;
    document.getElementById('locationText').placeholder = "location";
    document.getElementById('locationText').value = "";
    document.getElementById('locationText').disabled = true;
    document.getElementById('locationText').required = false;
}

function locationRadioButtonClicked() {
    document.getElementById("hereButton").checked = false;
    document.getElementById("locationButton").checked = true;
    document.getElementById('locationText').placeholder = "location";
    document.getElementById('locationText').disabled = false;
    document.getElementById('locationText').required = true;
}

function clearFormButtonClicked() {

    document.getElementById('searchForm').reset();
    document.getElementById("keyword").value = "";
    document.getElementById("category").value = "default";

    document.getElementById("distance").placeholder = 10;
    document.getElementById("distance").value = "";

    document.getElementById("hereButton").checked = true;
    document.getElementById("locationButton").checked = false;

    document.getElementById('locationText').placeholder = "location";
    document.getElementById('locationText').value = "";
    document.getElementById('locationText').disabled = true;

    document.getElementById("noRecords").innerHTML = "";
    document.getElementById("noRecords").className = "";
    document.getElementById("showData").innerHTML = "";
    document.getElementById("eventDetails").innerHTML = "";
    document.getElementById('horizontalLine').innerHTML = "";

}

function searchFormButtonClicked() {
    document.getElementById("noRecords").className = "";
    document.getElementById("noRecords").innerHTML = "";
    document.getElementById("showData").innerHTML = "";
    document.getElementById("eventDetails").innerHTML = "";
    document.getElementById('horizontalLine').innerHTML = "";
    getFormInputValues();
}

function getFormInputValues() {
    var keyword = document.getElementById("keyword").value;
    var category = document.getElementById("category").value;

    var distance = 10;
    if (document.getElementById("distance").value != "") {
        distance = document.getElementById("distance").value;
    }

    var locationParam;
    var isAddressLatLng;
    var lat; var long;
    if (document.getElementById("hereButton").checked == true) {
        isAddressLatLng = "1"
        const [latitude, longitude] = currLocation.split(',');     
        lat = latitude;
        long = longitude;
        
    } else if (document.getElementById("locationButton").checked == true && document.getElementById("locationText").value != "") {
        isAddressLatLng = "0"
        var location = document.getElementById("locationText").value;
        locationParam = location.replaceAll(" ","+");
    }

    if(keyword != '' && (locationParam != null || lat != null && long != null)) {


        var params = {
            'keyword' : keyword,
            'categoryType' : category,
            'distance' : distance,
            'isAddressLatLng' : isAddressLatLng,
            'address' : locationParam,
            'lat' : lat,
            'long' : long
        }
    
        $.ajax({
            dataType: "json",
            url: 'getEventsList',
            type: 'GET',
            async: false,
            data: params,
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                let res = JSON.stringify(response, null, 4);
                console.log(response)
                parseEventsListData(response);

            },
            error: function(request, status, error){
                console.table(`[ERROR]:${request.responseText}`);
                console.table(`[ERROR]:${error}`);
            }
        });

    }
    
}

function parseEventsListData(data) {
    if (data['isDataPresent'] == false) {
        console.log("No DATA")
        showNoRecords();
    } else {
        eventsList = data['events']
        createEventsTable(eventsList);
    }
    
}

function showNoRecords() {
    displayStr = 'No Records has been found';
    var noRecBox = document.createElement("p");
    noRecBox.style.marginTop = '0%';
    noRecBox.style.marginBottom = '0%';
    noRecBox.innerHTML = displayStr;

    var hrDiv = document.getElementById('horizontalLine');
    var hr = document.createElement("hr");
    hr.className = 'form-line';
    hrDiv.innerHTML = "";
    hrDiv.appendChild(hr);

    var divShowData = document.getElementById('noRecords');
    divShowData.className = "noRecordsBoxStyle";
    divShowData.innerHTML = "";
    divShowData.appendChild(noRecBox);
}

function createEventsTable(eventsList) {

    var col = ['date', 'icon', 'event', 'genre', 'venue'];
    var table = document.createElement("table");
    
    var tr = table.insertRow(-1);     
    tr.click(function(e) {
        var txt = $(e.value).text();
        console.log(txt);
     });              

    for (var i = 0; i < col.length; i++) {
        var th = document.createElement("th");  
        var val = capitalizeFirstLetter(col[i]);  
        if (col[i] == 'icon') {
            th.style.width = '8%';
        }
        th.innerHTML = val;
        tr.appendChild(th);
    }

    for (var i = 0; i < eventsList.length; i++) {

        tr = table.insertRow(-1);
        
        for (var j = 0; j < col.length; j++) {
            var tabCell = tr.insertCell(-1);

            if (col[j] == 'date') {
                tabCell.style.textAlign = 'center';
            }

            if (col[j] == 'icon') {
                var img = document.createElement('img'); 
                img.className = "logo";
                img.src = eventsList[i][col[j]]; 
                img.alt = "N/A"
                tabCell.appendChild(img)
            } else if (col[j] == 'event') {
                var value  = onClickTableCell(eventsList[i]['event'], eventsList[i]['event_id'])
                tabCell.appendChild(value)
            } else {
                tabCell.innerHTML = eventsList[i][col[j]];
            }             
        }
    }

    var divShowData = document.getElementById('showData');
    divShowData.innerHTML = "";
    divShowData.appendChild(table);
    
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

function onClickTableCell(name, id) {
    var event = document.createElement("a");
    event.appendChild(document.createTextNode(name));
    event.id = "eventName";
    event.setAttribute('onclick', 'fetchEventDetails("'+id+'")')
    return event;
}
 
function fetchEventDetails(eventId) {
    fetch('/getEventDetails?eventId='+eventId, {
            method: 'GET', 
            mode: 'cors', 
            credentials: 'same-origin', 
            headers: {
              'Content-Type': 'application/json'
            }
          })
            .then(function (response) {
                return response.json();
            }).then(function (data) {
                displayEventDetails(data);
            }).catch(error => console.log('error2', error));
    
}

function displayEventDetails(data) {
    console.log(data)

    var eventDetailsDiv = document.getElementById('eventDetails');
    eventDetailsDiv.innerHTML = "";
    var contentDiv = document.createElement('div');
    contentDiv.className = "contentDiv"

    //Event title
    if ('title' in data) {
        var title = document.createElement("h2");
        title.innerHTML = data['title']
        title.style.textAlign = 'center';
        eventDetailsDiv.appendChild(title);
    }
    
    //date
    if ('date' in data) {
        var dateTitle = document.createElement("h2");
        dateTitle.className = 'header';
        dateTitle.innerHTML = 'Date';
        var date = document.createElement("p");
        date.className = 'subheader';
        date.innerHTML = data['date']

        contentDiv.appendChild(dateTitle);
        contentDiv.appendChild(date);
    }

    //artists / team

    if ('artist_team' in data) {
        var artistTitle = document.createElement("h2");
        artistTitle.className = 'header';
        artistTitle.innerHTML = 'Artist / Team'
        var artist= document.createElement("p");
        artist.className = 'subheader';
    
        var artistStr = ""
        if(data['artist_team'][0]['name']){
            artistStr = `<a class="link" href="${data['artist_team'][0]['url']}" target="_blank">${data['artist_team'][0]['name']}</a>`;
        }
        
        for(var i = 1; i < data['artist_team'].length; i++){
            if(data['artist_team'][i]['name']){       
                artistStr += " | " + `<a class="link" href="${data['artist_team'][i]['url']}" target="_blank">${data['artist_team'][i]['name']}</a>`
            }
        }

        artist.innerHTML = artistStr
        contentDiv.appendChild(artistTitle);
        contentDiv.appendChild(artist);
    }

    
    //venue

    if ('venue' in data) {
        var venueTitle = document.createElement("h2");
        venueTitle.className = 'header';
        venueTitle.innerHTML = 'Venue'
        var venue= document.createElement("p");
        venue.className = "subheader";
        venue.innerHTML = data['venue']
        contentDiv.appendChild(venueTitle);
        contentDiv.appendChild(venue);
    }

    //genres
    if ('genres' in data) {
        var genresTitle = document.createElement("h2");
        genresTitle.className = 'header';
        genresTitle.innerHTML = 'Genres'
        var genre = document.createElement("p");
        genre.className = 'subheader';
        genre.innerHTML = data['genres']

        contentDiv.appendChild(genresTitle);
        contentDiv.appendChild(genre);
    }

    //prices
    if ('price' in data) {
        var pricesTitle = document.createElement("h2");
        pricesTitle.className = 'header';
        pricesTitle.innerHTML = 'Price Ranges'
        var price = document.createElement("p");
        price.className = 'subheader';
        price.innerHTML = data['price']

        contentDiv.appendChild(pricesTitle);
        contentDiv.appendChild(price);
    }

    //ticket status
    if ('ticket_status' in data) {
        var ticStatusTitle = document.createElement("h2");
        ticStatusTitle.className = 'header';
        ticStatusTitle.innerHTML = 'Ticket Status'
        var ticStatus = document.createElement("p");
        ticStatus.className = 'subheader';
        ticStatus.innerHTML = data['ticket_status']

        contentDiv.appendChild(ticStatusTitle);
        contentDiv.appendChild(ticStatus);
    }

    //buy ticket at
    if ('buy_at_url' in data) {
        var buyAtTitle = document.createElement("h2");
        buyAtTitle.className = 'header';
        buyAtTitle.innerHTML = 'Buy Ticket At'
        var buyAt = document.createElement("p");
        buyAt.className = "subheader";
        var buyAtUrl = openNewTab(data['buy_at'], data['buy_at_url'])
        buyAt.appendChild(buyAtUrl)

        contentDiv.appendChild(buyAtTitle);
        contentDiv.appendChild(buyAt);
    }
    
    eventDetailsDiv.appendChild(contentDiv);

    //seat map image
    if (data['seat_url'] != null) {
        var imgDiv = document.createElement('div'); 
        imgDiv.className = "seatMapDiv"
        contentDiv.style.width = '30%';
        contentDiv.style.float = 'left';
        contentDiv.style.paddingLeft = '20%'; 
        imgDiv.style.width = '50%';
        imgDiv.style.float = 'left';

        var img = document.createElement('img'); 
        img.src = data['seat_url']
        img.className = 'seatmap';
        imgDiv.appendChild(img)
        eventDetailsDiv.appendChild(imgDiv);
    } else {
        contentDiv.className = 'divCenter'
    }
}

function openNewTab(name, url) {

    var a = document.createElement('a'); 
    var link = document.createTextNode(name);
    a.appendChild(link); 
    a.title = name; 
    a.href = url; 
    a.target = "_blank";
    return a;
}