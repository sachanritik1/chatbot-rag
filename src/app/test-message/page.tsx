"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "@/components/ChatMessage";

export default function TestPage() {
  // Example message with ordered list, unordered list, and nested lists
  const testMessage = `
# Message Formatting Test

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

## Bullet points

* First item
* Second item with **bold text**
* Third item with *italic text*
  * Nested item 1
  * Nested item 2
    * Deeply nested item

## Code example

\`\`\`javascript
function TestComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);
  
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
\`\`\`

Let me know if you need more information!
`;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Message Format Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChatMessage
            role="bot"
            content={testMessage}
            timestamp={new Date()}
          />
          <div className="pt-4">
            <Button onClick={() => window.history.back()}>Back</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
