import { useEffect, useState } from "react";
import "./App.css";


const stagingList = 'abcdefghijklmnop'.split('');


const EVENT_DIRECTION = {
  order_submitted: "Right",
  order_send: "Right",
  conveyo_order_send: "Right",
  conveyo_opa_order_send: "Right",
  conveyo_sms_order_send: "Right",
  relayo_order_send: "Right",
  conveyo_alarm_invoke: "Left",
  yogiyo_dowant_opa_order_callback_send: "Left",
  yogiyo_dowant_relayo_order_callback_send: "Left",
  yogiyo_dowant_sms_order_callback_send: "Left",
  conveyo_order_callback_send: "Left",
  conveyo_order_changed: "Right",
  orderyo_alarm_receive: "Left",
  orderyo_rider_status_callback: "Left",
  conveyo_opa_order_cancel: "Right",
  orderyo_order_timeout: "Left",
  order_status_updated: "Left",
  orderyo_backend_process: "Left",
  conveyo_opa_timeout_alarm_receive: "Left"
}

const ORIGIN_CONVEYO_EVENTS = [
  "order_submitted",
  "conveyo_order_send",
  "order_send",
  "yogiyo_dowant_opa_order_callback_send",
  "yogiyo_dowant_relayo_order_callback_send",
  "yogiyo_dowant_sms_order_callback_send",
  "orderyo_alarm_receive",
  "conveyo_opa_order_cancel",
  "orderyo_order_timeout",
  "order_status_updated",
  "conveyo_opa_timeout_alarm_receive"
]

const CONVEYO_TARGET_EVENTS = [
  "conveyo_opa_order_send",
  "relayo_order_send",
  "conveyo_sms_order_send",
  "conveyo_alarm_invoke",
  "conveyo_order_callback_send",
  "orderyo_rider_status_callback",
  "conveyo_order_changed"
]

const STATUS_UPDATE_EVENTS = [
  "yogiyo_dowant_opa_order_callback_send",
  "yogiyo_dowant_relayo_order_callback_send",
  "yogiyo_dowant_sms_order_callback_send",
  "order_status_updated"
]

function getTitle(event) {
  let title
  if (STATUS_UPDATE_EVENTS.includes(event.meta.event)) {
    title = `${event.meta.event}:\n${event.data ? event.data.event : JSON.parse(event.response).event}`
  } else if (event.meta.event === "conveyo_order_callback_send") {
    title = `${event.meta.event}:\n${event.transmission_data ? event.transmission_data.data.event : event.target_response.status}`
  } else if (event.meta.event === "orderyo_rider_status_callback") {
    title = event.target_response.event
  } else if (event.meta.event === "orderyo_backend_process" && event.type === "transmission") {
    title = event.message
  } else {
    title =  event.meta.event
  }

  return `${event.eventIndex}: ${title}`
}


function Arrow({ selected, event, handleClick }) {
  const eventName = event.meta.event
  const direction = EVENT_DIRECTION[eventName]
  const className = "arrowHead arrow" + direction
  return (
    <div className="arrow">
      <div className={`arrowTitle ${selected ? "selected" : null}`} onClick={handleClick}>{getTitle(event)}</div>
      <div className={className}/>
    </div>
  )
}

function AlimTalk({ selected, event, handleClick }) {
  return (
    <div className={`alimTalkProcess ${selected ? "selected" : null}`} onClick={handleClick}>
      {event.eventIndex}: {event.meta.event} {event.type}
    </div>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState()
  const [orderSendEvent, setOrderSendEvent] = useState();

  const [originConveyoEvents, setOriginConveyoEvents] = useState([]);
  const [conveyoTargetEvents, setConveyoTargetEvents] = useState([]);
  const [orderyoBackendProcessEvents, setOrderyoBackendProcessEvents] = useState([]);

  const [currentEvent, setCurrentEvent] = useState();
  const [showEventLog, setShowEventLog] = useState(false);
  const [logPosition, setLogPosition] = useState();
  const [selectedEventIndex, setSelectedEventIndex] = useState();

  const [env, setEnv] = useState("hubyo");
  const [trackingId, setTrackingId] = useState(647818940);
  const [platform, setPlatform] = useState("YGY-DOWANT");

  const clearState = () => {
    setEvents([]);
    setShowEventLog(false);
    setCurrentEvent(undefined);
    setSelectedEventIndex(undefined);
  }

  const closeModal = () => {
    setCurrentEvent(undefined); 
    setShowEventLog(false);
    setLogPosition(undefined);
    setSelectedEventIndex(undefined);
  }

  const handleEnter = (e) => {
    if (e.code === "Enter") {
      getHubyoData()
    }
  }

  const getHubyoData = () => {
    clearState();
    setIsLoading(true)

    const request = new XMLHttpRequest()
    request.open("GET", `https://${env}.yogiyo.co.kr/list?platform=${platform}&entity=order&tracking_id=${trackingId}`)
    request.onreadystatechange = () => {
      if (request.readyState === XMLHttpRequest.DONE) {
        const eventList = JSON.parse(request.response)
        setEvents(eventList.map((value, index) => {value["eventIndex"] = index + 1; return value}));
        setIsLoading(false);
      }
    }
    request.send()
  }

  const selectPlatform = (platform) => {
    if (platform.includes("staging")) {
      setEnv("staging-hubyo")
    } else {
      setEnv("hubyo")
    }
    setPlatform(platform)
  }

  const isTransmissionBackendProcess = (message) => {
    return message.meta.event === "orderyo_backend_process" && message.type === "transmission"
  }

  const isAlimTalkBackendProcess = (message) => {
    return message.meta.event === "orderyo_backend_process" && message.type === "alim_talk"
  }

  const handleEventClick = (value, index, position) => {
    setCurrentEvent(value); 
    setShowEventLog(true);
    setLogPosition(position);
    setSelectedEventIndex(value.eventIndex);
  }

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      console.log(e)
      if (e.code === "Escape") {
        closeModal()
      }
    })
  }, [])

  useEffect(() => {
    if (events) {
      const originConveyoEvents = events.filter((value) => ORIGIN_CONVEYO_EVENTS.includes(value.meta.event) || isTransmissionBackendProcess(value));
      setOriginConveyoEvents(originConveyoEvents)
      setOrderSendEvent(originConveyoEvents[0])
      setConveyoTargetEvents(
        events.filter((value) => CONVEYO_TARGET_EVENTS.includes(value.meta.event))
      )
      setOrderyoBackendProcessEvents(
        events.filter((value) => value.meta.event === "orderyo_backend_process" && isAlimTalkBackendProcess(value))
      )
    } else {
      setOrderyoBackendProcessEvents([]);
      setOriginConveyoEvents([]);
      setConveyoTargetEvents([]);
      setOrderSendEvent(undefined);
    }
  }, [events])

  return (
    <div className="App">
      <div className="rootContainer">
        <div  className="header">
          <div className="hubyoUrlDisplay">
            https://<span className="hubyoUrlBold">{env}</span>
            {`.yogiyo.co.kr/list?platform=`}
            <span className="hubyoUrlBold">{platform}</span>
            {`&entity=order&tracking_id=`}
            <span className="hubyoUrlBold">{trackingId}</span>
          </div>
          <div className="inputContainer">
            <div className="inputLeftSection">
              <div className="inputWrapper">
                <label>Platform</label>
                <select onKeyDown={handleEnter} className="inputStyle" name="platform" placeholder="Platform" onChange={(e) => selectPlatform(e.target.value)} value={platform}>
                  <optgroup label="Staging">
                    {stagingList.map((value, index) => {
                      return <option key={index} value={`YGY-staging-${value}`}>YGY-staging-{value}</option>
                    })}
                  </optgroup>
                  <optgroup label="Production">
                    <option value="YGY">YGY</option>
                    <option value="YGY-DOWANT">YGY-DOWANT</option>
                  </optgroup>
                </select>
              </div>
              <div className="inputWrapper">
                <label>Tracking ID</label>
                <input onKeyDown={handleEnter} style={{width: "105px"}} className="inputStyle" title="trackingId" onChange={(e) => setTrackingId(e.target.value)} value={trackingId} />
              </div>
            </div>
            <div className="inputRightSection">
              <div className={isLoading ? "spinner spinning" : "spinner"}/>
              <button className="requestButton" onClick={getHubyoData}>Send Request</button>
            </div>
          </div>
        </div>
        {events ? 
          <div className="componentsDisplay"> 
            {orderSendEvent && orderSendEvent.meta.publisher === "orderyo" ? 
              <div className="orderyoBackendProcessContainer">
                <div className="alimTalkTitle">Alim Talk</div>
                {orderyoBackendProcessEvents.map((value, index) => {
                    return <AlimTalk event={value} selected={value.eventIndex === selectedEventIndex} handleClick={() => handleEventClick(value, index, "R")}/>
                  })}
              </div> : null
            }
            <div className="component">
              Origin {`${orderSendEvent ? `(${orderSendEvent.meta.publisher})` : ""}`}
            </div>

            <div className="arrowContainer">
              {originConveyoEvents.map((value, index) => {
                return <Arrow key={index} selected={value.eventIndex === selectedEventIndex} event={value} handleClick={() => handleEventClick(value, index, "R")}/>
              })}
            </div>

            <div className="component">
              Conveyo
            </div>

            <div className="arrowContainer">
              {conveyoTargetEvents.map((value, index) => {
                return <Arrow key={index} selected={value.eventIndex === selectedEventIndex} event={value} handleClick={() => handleEventClick(value, index, "L")}/>
              })}
            </div>

            <div className="component">
              Targets
            </div>
          </div>
        :null}
        {showEventLog?
        <div className={`eventViewContainer ${logPosition === "L" ? "onLeft" : "onRight"}`}>
          <button 
          className="closeButton" 
          onClick={closeModal}>Close
          </button>
          <div className="previewWrapper">
            <pre className="codePreview">
              {JSON.stringify(currentEvent, null, 2)}
            </pre>
          </div>
        </div> : null
        }
      </div>
    </div>
  );
}

export default App;
