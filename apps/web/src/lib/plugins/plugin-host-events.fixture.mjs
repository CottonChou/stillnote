export default {
  activate(context) {
    const disposeSettings = context.events.on("settings.changed", ({ key }) => {
      globalThis.stillnotePluginObservedSettings ??= [];
      globalThis.stillnotePluginObservedSettings.push({ pluginId: context.pluginId, key });
    });
    const disposeNote = context.events.on("note.updated", ({ note }) => {
      globalThis.stillnotePluginObservedNote = note;
    });
    const disposeTemplate = context.events.on("template.created", ({ template }) => {
      globalThis.stillnotePluginObservedTemplate = template;
    });
    const disposeResource = context.events.on("resource.updated", ({ resource }) => {
      globalThis.stillnotePluginObservedResource = resource;
    });
    return () => {
      disposeSettings();
      disposeNote();
      disposeTemplate();
      disposeResource();
    };
  },
};
