// editor.commands.removeCommand('find');
// editor.commands.addCommand({
//     name: 'customFind',
//     bindKey: {win: 'Ctrl-F', mac: 'Command-F'},
//     exec: function(editor) {
//         // Your custom logic
//         return true; // Return true to signal the command was handled
//     }
// });

export const processShortcuts = (editor) => {
  editor.commands.addCommand({
    name: 'openFile',
    bindKey: { win: 'Ctrl-O', mac: 'Command-O' },
    exec: function (editor) {
      console.log('Open file shortcut triggered');
      return true;
    },
  });
  editor.commands.addCommand({
    name: 'newFile',
    bindKey: { win: 'Ctrl-N', mac: 'Command-N' },
    exec: function (editor) {
      console.log('New file shortcut triggered');
      return true;
    },
  });

  editor.commands.addCommand({
    name: 'findFile',
    bindKey: { win: 'Ctrl-F', mac: 'Command-F' },
    exec: function (editor) {
      console.log('Find file shortcut triggered');
      return true;
    },
  });
};

export default processShortcuts;
