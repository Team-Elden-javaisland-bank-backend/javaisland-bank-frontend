import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'apiUrl',
  standalone: true
})
export class ApiUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string | null | undefined {
    if (value === null || value === undefined || value === '') {
      return value;
    }
    return environment.apiUrl + value;
  }
}