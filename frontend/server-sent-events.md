# Server-sent Events

## Overview

### Scope

In this article, we'll talk about the content below.

- Compare with WebSocket
- Describe how to implement server-sent events with raw Node.js
- Describe how to implement server-sent events with Next.js
- Describe how to listen to server-sent events with React
- Describe how to create a custom `useEffectEvent` hook

## Compare with WebSocket

## Implement Server-sent Events with raw Node.js

According to the [specification][WHATWG - Server-sent events], we only need to set 1 response header as below.

```javascript
res.setHeader('Content-Type', 'text/event-stream')
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

## Implement Server-sent Events with Next.js

```javascript
res.setHeader('Cache-Control', 'no-store')
res.setHeader('Content-Encoding', 'none')
```

## Listen to Server-sent Events

## Create a Custom `useEffectEvent` Hook

## References

- [MDN - Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [WHATWG - Server-sent events][WHATWG - Server-sent events]

[WHATWG - Server-sent events]: https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events