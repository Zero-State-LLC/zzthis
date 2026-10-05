// Placeholder until spec 005 T001 and T002 add the router, the settings
// check, and the asset handler. Every request gets 404 for now.
export default {
  fetch(): Response {
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
