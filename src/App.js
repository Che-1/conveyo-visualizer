import { useEffect, useState } from 'react';
import './App.css';


const EVENT_DIRECTION = {
  order_submitted: 'Right',
  order_send: 'Right',
  conveyo_order_send: 'Right',
  conveyo_opa_order_send: 'Right',
  conveyo_sms_order_send: 'Right',
  relayo_order_send: 'Right',
  conveyo_alarm_invoke: 'Left',
  yogiyo_dowant_opa_order_callback_send: 'Left',
  yogiyo_dowant_relayo_order_callback_send: 'Left',
  yogiyo_dowant_sms_order_callback_send: 'Left',
  conveyo_order_callback_send: 'Left',
  conveyo_order_changed: 'Right',
  orderyo_alarm_receive: 'Left',
  orderyo_rider_status_callback: 'Left',
  conveyo_opa_order_cancel: 'Right',
  orderyo_order_timeout: 'Left',
  order_status_updated: 'Left'
}

const ORIGIN_CONVEYO_EVENTS = [
  'order_submitted',
  'conveyo_order_send',
  'order_send',
  'yogiyo_dowant_opa_order_callback_send',
  'yogiyo_dowant_relayo_order_callback_send',
  'yogiyo_dowant_sms_order_callback_send',
  'orderyo_alarm_receive',
  'conveyo_opa_order_cancel',
  'orderyo_order_timeout',
  'order_status_updated'
]

const CONVEYO_TARGET_EVENTS = [
  'conveyo_opa_order_send',
  'relayo_order_send',
  'conveyo_sms_order_send',
  'conveyo_alarm_invoke',
  'conveyo_order_callback_send',
  'orderyo_rider_status_callback',
  'conveyo_order_changed'
]

const STATUS_UPDATE_EVENTS = [
  'yogiyo_dowant_opa_order_callback_send',
  'yogiyo_dowant_relayo_order_callback_send',
  'yogiyo_dowant_sms_order_callback_send',
  'order_status_updated'
]

function getTitle(event) {
  let title
  if (STATUS_UPDATE_EVENTS.includes(event.meta.event)) {
    title = `${event.meta.event}:\n${event.data ? event.data.event : JSON.parse(event.response).event}`
  } else if (event.meta.event === 'conveyo_order_callback_send') {
    title = `${event.meta.event}:\n${event.transmission_data ? event.transmission_data.data.event : event.target_response.status}`
  } else if (event.meta.event === 'orderyo_rider_status_callback') {
    title = event.target_response.event
  } else {
    title =  event.meta.event
  }

  return `${event.eventIndex}: ${title}`
}


function Arrow({ event, handleClick }) {
  const eventName = event.meta.event
  const direction = EVENT_DIRECTION[eventName]
  const className = "arrowHead arrow" + direction
  return (
    <div className="arrow">
      <div className="arrowTitle" onClick={handleClick}>{getTitle(event)}</div>
      <div className={className}/>
    </div>
  )
}

function App() {
  const [events, setEvents] = useState()
  const [orderSendEvent, setOrderSendEvent] = useState();

  const [originConveyoEvents, setOriginConveyoEvents] = useState([]);
  const [conveyoTargetEvents, setConveyoTargetEvents] = useState([]);

  const [currentEvent, setCurrentEvent] = useState();
  const [showEventLog, setShowEventLog] = useState(false);

  const [env, setEnv] = useState('hubyo');
  const [trackingId, setTrackingId] = useState(647818940);
  const [platform, setPlatform] = useState('YGY-DOWANT');

  const getHubyoData = () => {
    const request = new XMLHttpRequest()
    request.open('GET', `https://${env}.yogiyo.co.kr/list?platform=${platform}&entity=order&tracking_id=${trackingId}`)
    request.onreadystatechange = () => {
      if (request.readyState === XMLHttpRequest.DONE) {
        const eventList = JSON.parse(request.response)
        setEvents(eventList.map((value, index) => {value['eventIndex'] = index + 1; return value}));
        setShowEventLog(false);
        setCurrentEvent(undefined);

      }
    }
    request.send()
  }

  useEffect(() => {
    setInterval(() => {
      // getHubyoData()
    }, 1000)
  }, [])

  useEffect(() => {
    if (events) {
      const originConveyoEvents = events.filter((value) => ORIGIN_CONVEYO_EVENTS.includes(value.meta.event));
      setOriginConveyoEvents(originConveyoEvents)
      setOrderSendEvent(originConveyoEvents[0])
      setConveyoTargetEvents(
        events.filter((value) => CONVEYO_TARGET_EVENTS.includes(value.meta.event))
      )
    } else {
      setOriginConveyoEvents([]);
      setConveyoTargetEvents([]);
      setOrderSendEvent(undefined);
    }
  }, [events])

  return (
    <div className="App">
      <div className="rootContainer">
        <div>
          <div className="hubyoUrlDisplay">
            https://<span className="hubyoUrlBold">{env}</span>
            {`.yogiyo.co.kr/list?platform=`}
            <span className="hubyoUrlBold">{platform}</span>
            {`&entity=order&tracking_id=`}
            <span className="hubyoUrlBold">{trackingId}</span>
          </div>
          <div className="inputWrapper">
            <label>Platform</label>
            <input title="platform" onChange={(e) => setPlatform(e.target.value)} value={platform} />
            <label>Tracking ID</label>
            <input title="trackingId" onChange={(e) => setTrackingId(e.target.value)} value={trackingId} />
            <label>Env</label>
            <input title="env" onChange={(e) => setEnv(e.target.value)} value={env} />
            <button onClick={getHubyoData}>Send Request</button>
            <button onClick={() => currentEvent ? setShowEventLog(!showEventLog) : null}>Show Message Log</button>
          </div>
        </div>
        {events ? 
          <div className="componentsDisplay"> 
            <div className="origin">
              Origin {`${orderSendEvent ? `(${orderSendEvent.meta.publisher})` : ''}`}
            </div>

            <div className="arrowContainer">
              {originConveyoEvents.map((value, index) => {
                return <Arrow key={index} event={value} handleClick={() => {setCurrentEvent(value); setShowEventLog(true)}}/>
              })}
            </div>

            <div className="origin">
              Conveyo
            </div>

            <div className="arrowContainer">
              {conveyoTargetEvents.map((value, index) => {
                return <Arrow key={index} event={value} handleClick={() => {setCurrentEvent(value); setShowEventLog(true)}}/>
              })}
            </div>

            <div className="origin">
              Targets
            </div>
          </div>
        :null}
        {showEventLog? 
        <div className="eventViewContainer">
          <pre className="codePreview">
            {JSON.stringify(currentEvent, null, 2)}
          </pre>
        </div> : null
        }
        

      </div>
    </div>
  );
}

export default App;
