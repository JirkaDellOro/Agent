# Agent
This static class creates a dialog to retrieve one or more URLs from the user.
The URLs should point to a javascript module containing an exported object, 
which can be automatically created using a namespace in TypeScript, that contains required functions.
If the URLs are valid, each object is saved as an instance of this class in a list of agents.

After after closing the dialog, call e.g. the function `foo` of agent 1 with the followin syntax 
```typescript 
Agent.get(1).foo(...)
``` 

With this module, students can write small functions that may be used in a larger independend context, like a small game, in order to learn programming or other concepts.