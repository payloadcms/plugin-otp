# Payload One-time Password Plugin Tutorial

This repository demonstrates how to build a well-structured and advanced plugin that allows for one-time login. It showcases how to do many things:

- Build a bulletproof Payload plugin structure that follows best practices
- Promote plugin type safety and add developer-friendly JSDocs to the plugin options 
- Add new operations, surfaced via local API functions, REST endpoints, and GraphQL mutations
- Extend Payload authentication while reusing existing functionality
- Build an pattern into a plugin for extending its internal logic further, following familiar Payload practices
- Properly export plugin utilities in case developers want to re-use them in their own code
- Build and publish an NPM package
- Set up an integration test suite that ensures the plugin has great test coverage