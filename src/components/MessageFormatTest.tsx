import { ChatMessage } from "./ChatMessage";

export function MessageFormatTest() {
  const testContent = `
Here are some commonly used hooks in React:

1. useState
2. useEffect
3. useContext
4. useReducer
5. useCallback
6. useMemo
7. useRef
8. useImperativeHandle
9. useLayoutEffect
10. useDebugValue

These hooks are essential for managing state, side effects, context, and more in React functional components.

And here are some bullet points:

* First item
* Second item
* Third item
  * Nested item 1
  * Nested item 2

Let me know if you need more information!
`;

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-xl font-bold">Message Format Test</h2>
      <ChatMessage role="bot" content={testContent} timestamp={new Date()} />
    </div>
  );
}
