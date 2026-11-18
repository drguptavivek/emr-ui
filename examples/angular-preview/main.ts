import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreviewAppComponent } from './preview-app.component';

bootstrapApplication(PreviewAppComponent).catch((err) => console.error(err));
