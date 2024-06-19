# Server-sent Events

Written at: 2024/06/19 

## Overview

In this article, we'll talk about some common ways to push message from server to client, and describe how to create server-sent events with raw Node.js and Next.js, and how to listen to the events with React.

### Environment

- React: 18.3.1
- Next.js: 14.2.4
- Node.js: 22.3.0

### Scope

- Compare with WebSocket
- Describe how to implement server-sent events with raw Node.js
- Describe how to implement server-sent events with Next.js
- Describe how to listen to server-sent events with React
- Describe how to create a custom `useEffectEvent` hook

## Compare with WebSocket

| Feature                 | WebSocket                                                                   | Server-Sent Events (SSE)                                |
|-------------------------|-----------------------------------------------------------------------------|---------------------------------------------------------|
| Communication Direction | Bidirectional (Full-Duplex)                                                 | Unidirectional (Server to Client)                       |
| Data Formats            | Text and Binary                                                             | Text Only                                               |
| Connection              | Persistent                                                                  | Persistent (with automatic reconnection)                |
| Complexity              | More complex to implement                                                   | Simpler to implement                                    |
| Reconnection Handling   | Requires manual implementation                                              | Built-in automatic reconnection                         |
| Browser Support         | Widely supported                                                            | Widely supported                                        |
| Use Cases               | Real-time applications like chat, games                                     | Live feeds, notifications, data updates                 |
| Transport Protocol      | Custom WebSocket protocol over TCP                                          | Standard HTTP protocol                                  |
| Next.js Integration     | Have to create another WebSocket server and integrate with Next.js manually | Common request handler with some simple header settings |

## Implement Server-sent Events with raw Node.js

According to the [specification][WHATWG - Server-sent events], we only need to set 1 response header as below.

```javascript
res.setHeader('Content-Type', 'text/event-stream')
```

But for preventing from cached by a proxy or a gateway, we also need to set another header.

```javascript
res.setHeader('Cache-Control', 'no-cache')
```

And then we can just use the method below to send any message.

```javascript
res.write('data: any message\n\n')
```

Or send json data as a plain text.

```javascript
res.write(`data: ${JSON.stringify(json)}\n\n`)
```

### Send a comment line as heartbeat message

According to the [specification][WHATWG - Server-sent events], we can also send a comment line as heartbeat every 15 seconds or so to avoid that some legacy proxy servers drop HTTP connections after a short timeout.

```javascript
res.write(`:heartbeat\n\n`)
```

### Release all resources once the connection is closed

We also must listen to `close` event of response to signal to the server that the response ends once the connection is closed to avoid memory leaks.

```javascript
// Listen for client disconnect
res.on('close', () => {
  res.end()
})
```

Because Next.js enables compress by default and that will buffer data before writing output to the client, but that will prevent the server from sending any message. So we have to set the `Content-Encoding` to `none` explicitily to prevent server buffering.

## Implement Server-sent Events with Next.js

```javascript
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Content-Encoding', 'none')
```

## Listen to Server-sent Events with React

Listening to Server-sent Events with React is simple. We can just wrap the logic with `useEffect`. However **please do not forget to return a function of closing listening events**. Otherwise, the connection will be open until we close the browser.

```javascript
useEffect(() => {
  const events = new EventSource(api)
  
  events.onmessage = (event) => onMessageEvent(event.data)
  
  return () => events.close()
}, [api, onMessageEvent])
```

### Use the Official Experimental `useEffectEvent` Hook

If we want the Effect which wraps the listening logic can only re-runs in response to some values but not others, and prevent the listening from connecting and closing too frequently, we can use the [React built-in `useEffectEvent` hook][React - Separating Events from Effects]. However until now (React: 18.3.3), this hook is still experimental and only available in experimental React. So if we want use the feature in the production version, we have to create a custom one by ourselves.

### Create a Custom `useEffectEvent` Hook

```javascript
function useEffectEvent<T extends (...args: any[]) => any>(callback: T) {
  const fn = useRef<T | null>(null)

  fn.current = callback

  return (...args: Parameters<T>) => {
    if (fn.current) {
      fn.current(...args)
    }
  }
}

const onMessageEvent = useEffectEvent(someFunctionWithStateVariable)

useEffect(() => {
  const events = new EventSource(api)
  
  events.onmessage = (event) => onMessageEvent(event.data)
  
  return () => events.close()
  // Exclude the `onMessageEvent` from the dependencies intentionally
}, [api])
```

## References

- [MDN - Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [WHATWG - Server-sent events][WHATWG - Server-sent events]
- [React - Separating Events from Effects][React - Separating Events from Effects]

[WHATWG - Server-sent events]: https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events
[React - Separating Events from Effects]: https://react.dev/learn/separating-events-from-effects