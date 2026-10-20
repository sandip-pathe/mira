const fs = require('node:fs/promises');
const path = require('node:path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const exclusions = ['root', 'file', 'database', 'sharedpref', 'external']
  .map(domain => `    <exclude domain="${domain}" path="." />`).join('\n');
const backupRules = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
${exclusions}
</full-backup-content>
`;
const extractionRules = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
${exclusions}
  </cloud-backup>
  <device-transfer>
${exclusions}
  </device-transfer>
</data-extraction-rules>
`;

module.exports = config => {
  config = withAndroidManifest(config, mod => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) throw new Error('Missing Android application for private-data backup rules.');
    app.$['android:allowBackup'] = 'false';
    app.$['android:fullBackupContent'] = '@xml/mira_backup_rules';
    app.$['android:dataExtractionRules'] = '@xml/mira_data_extraction_rules';
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const directory = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'mira_backup_rules.xml'), backupRules, 'utf8');
    await fs.writeFile(path.join(directory, 'mira_data_extraction_rules.xml'), extractionRules, 'utf8');
    return mod;
  }]);
};
