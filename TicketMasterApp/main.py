from flask import Flask, render_template, request, jsonify
import json
import requests
from werkzeug.exceptions import abort
from geolib import geohash

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/getEventsList') 
def getEventsList():
    keyword = request.args.get('keyword')
    category_type = request.args.get('categoryType')
    distance = request.args.get('distance')
    isAddressLatLng = request.args.get('isAddressLatLng')
    address = request.args.get('address')
    lat = request.args.get('lat')
    long = request.args.get('long')

    if isAddressLatLng == "0":
        lat, long = getUserLocationLatLng(address)


    geohashValue = getGeohashEncodedValues(lat, long)
    segmentId = getSegmentid(category_type)

    responseData = callTicketMasterApi(geohashValue, distance, segmentId, keyword)
    if responseData['isDataPresent'] == True :
        event_response = parseTicketMasterApiResponse(responseData['data'])
    else:
        event_response = {
            "isDataPresent" : False
        }
    
    return event_response
        
def getUserLocationLatLng(address):
    url = "https://maps.googleapis.com/maps/api/geocode/json?address="+address+"&key=GoogleApiKey"
    data = requests.get(url)

    if data.status_code not in range(200, 299):
        return None, None
    try:
        results = data.json()['results'][0]
        latitude = results['geometry']['location']['lat']
        longitude = results['geometry']['location']['lng']   
    except:
        pass
    return str(latitude), str(longitude)

def getGeohashEncodedValues(lat, long):
    geohashVal = geohash.encode(lat, long, 7)
    return geohashVal

def getSegmentid(category_type):
    category = {
        "default" : "",
        "music" : "KZFzniwnSyZfZ7v7nJ",
        "sports" : "KZFzniwnSyZfZ7v7nE",
        "arts" : "KZFzniwnSyZfZ7v7na",
        "film" : "KZFzniwnSyZfZ7v7nn",
        "miscellaneous" : "KZFzniwnSyZfZ7v7n1"
    }
    segementId = category.get(category_type)
    return segementId

def callTicketMasterApi(geohashValue, distance, segment_id, keyword):
    unit = "miles"
    url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey="+api_key+"&keyword="+keyword+"&segmentId="+segment_id+"&radius="+distance+"&unit="+unit+"&geoPoint="+geohashValue
    data = requests.get(url)

    if data.status_code not in range(200, 299):
        print("error")
        return None, None
    try:
        events_data = data.json()
        
    except:
        pass

    jsonResponse = {}

    if not '_embedded' in events_data or len(events_data['_embedded']) == 0:
        jsonResponse = {'isDataPresent' : False }
    else:
        jsonResponse = {
            'isDataPresent' : True,
            'data' : events_data['_embedded']
         }
    
    return jsonResponse

def parseTicketMasterApiResponse(events_data):
    event_response = {}
    if not 'events' in events_data or len(events_data['events']) == 0:
        event_response['isDataPresent'] = False
    else:
        event_list = []
        for item in events_data['events']:
    
            event_details = {"event_id" : None,"date" : "N/A", "icon" : None, "event" : "N/A", "genre" : "N/A", "venue": "N/A" }

            if 'id' in item:
                event_details['event_id'] = item['id']

            if 'dates' in item and 'start' in item['dates']:
                date = item['dates']['start']
                dateStr = ''
                if 'localDate' in date:
                    dateStr = date['localDate']
                if 'localTime' in date:
                    dateStr += ' ' + date['localTime']
                event_details['date'] = dateStr

            image_details = item['images'][0]
            image = image_details['url']
            event_details['icon'] = image

            event_details['event'] = item['name']

            if 'classifications' in item and len(item['classifications']) != 0:
                genreDetails = item['classifications'][0]
                if 'segment' in genreDetails and 'name' in genreDetails['segment']:
                    genre = genreDetails['segment']['name']
                    event_details['genre'] = genre

            if '_embedded' in item and 'venues' in item['_embedded'] and len(item['_embedded']['venues']) != 0:
                venue_details = item['_embedded']['venues'][0]
                if 'name' in venue_details:
                    venue = venue_details['name']
                    event_details['venue'] = venue

            event_list.append(event_details)

        event_response = {
            "isDataPresent" : True,
            "events" : event_list
        }

    return event_response

@app.route('/getEventDetails')
def getEventDetails():
    event_id = request.args.get('eventId')
    url = 'https://app.ticketmaster.com/discovery/v2/events/'+event_id+'?apikey='+api_key
    data = requests.get(url)

    if data.status_code not in range(200, 299):
        print("error")
        return None, None
    try:
        events_details = data.json()        
    except:
        pass
    print(events_details)
    response = parseEventDetailsApi(events_details)
    return response

def parseEventDetailsApi(event_details):
    event_response = {}
    undefinedCase = ['Undefined', 'undefined', 'UNDEFINED']

    if 'name' in event_details and event_details['name'] not in undefinedCase:
        event_response['title'] = event_details['name']

    if 'dates' in event_details and 'start' in event_details['dates']:
        date = event_details['dates']['start']
        dateStr = ''
        if 'localDate' in date:
            dateStr = date['localDate']
        if 'localTime' in date:
            dateStr += ' ' + date['localTime']
        event_response['date'] = dateStr

    if '_embedded' in event_details and 'attractions' in event_details['_embedded'] and len(event_details['_embedded']['attractions']) != 0:
        artists = event_details['_embedded']['attractions']
        artistsArr = []
        for i in range(0, len(artists)):
            artist = {}
            if 'name' in artists[i]:
                artist['name'] = artists[i]['name']
            if 'url' in artists[i]:
                artist['url'] = artists[i]['url']
            artistsArr.append(artist)
            
        event_response['artist_team'] = artistsArr

    if '_embedded' in event_details and 'venues' in event_details['_embedded'] and len(event_details['_embedded']['venues']) != 0:
        venues = event_details['_embedded']['venues'][0]
        event_response['venue'] = venues['name']
    
    if 'classifications' in event_details and len(event_details['classifications']) != 0:
        genre_str = ''
        for i in range(0, len(event_details['classifications'])):
            classifications = event_details['classifications'][i]
            
            if 'segment' in classifications and classifications['segment']['name'] not in undefinedCase and genre_str.find(classifications['segment']['name']) == -1:
                genre_str += classifications['segment']['name'] + ' | '

            if 'genre' in classifications and classifications['genre']['name'] not in undefinedCase and genre_str.find(classifications['genre']['name']) == -1:
                genre_str += classifications['genre']['name'] + ' | '
        
            if 'subGenre' in classifications and classifications['subGenre']['name'] not in undefinedCase and genre_str.find(classifications['subGenre']['name']) == -1:
                genre_str += classifications['subGenre']['name'] + ' | '
        
            if 'type' in classifications and classifications['type']['name'] not in undefinedCase and genre_str.find(classifications['type']['name']) == -1:
                genre_str += classifications['type']['name'] + ' | '

            if 'subType' in classifications and classifications['subType']['name'] not in undefinedCase and genre_str.find(classifications['subType']['name']) == -1:
                genre_str += classifications['subType']['name'] + ' | '

        
        genre_str = genre_str[:-3]
        event_response['genres'] = genre_str

    if 'priceRanges' in event_details and len(event_details['priceRanges']) != 0:
        prices = event_details['priceRanges'][0]
        if prices['min'] != prices['max']:
            event_response['price'] = str(prices['min']) + '-' + str(prices['max']) + ' ' + prices['currency']
        else:
            event_response['price'] = str(prices['min']) + ' ' + prices['currency']

    if 'dates' in event_details and 'status' in event_details['dates'] and 'code' in event_details['dates']['status']:
        event_response['ticket_status'] = event_details['dates']['status']['code']

    if 'url' in event_details:   
        event_response['buy_at'] = 'Ticketmaster'
        event_response['buy_at_url'] = event_details['url']

    if 'seatmap' in event_details and 'staticUrl' in event_details['seatmap']:
        event_response['seat_url'] = event_details['seatmap']['staticUrl']

    return event_response

if __name__ == "__main__":
    app.run(debug=True)
