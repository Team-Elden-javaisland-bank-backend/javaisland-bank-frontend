import { Component, ElementRef, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface ComuneDto {
  nome: string;
  provincia: string;
  codiceCatastale: string;
}

interface PhotonProperties {
  street?: string;
  name?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  country?: string;
}

interface PhotonFeature {
  properties: PhotonProperties;
}

interface AddressSuggestion {
  street: string;
  housenumber: string;
  postcode: string;
  city: string;
  country: string;
}

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnDestroy {
  private translate = inject(TranslateService);
  firstName = '';
  lastName = '';
  birthDate = '';
  birthPlace = '';
  birthProvince = '';
  birthPlaceSearch = '';
  showCitySuggestions = false;
  filteredCities: ComuneDto[] = [];
  residenceSearch = '';
  showResidenceSuggestions = false;
  filteredAddresses: AddressSuggestion[] = [];
  fiscalCode = '';
  phone = '';
  profession = '';
  gender = '';
  residence = '';
  houseNumber = '';
  postcode = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  showSuccessModal = signal(false);
  loading = signal(false);

  passwordStrength = signal<'weak' | 'medium' | 'strong' | ''>('');

  private birthCatastalCode = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  professions = [
    'Studente', 'Impiegato', 'Imprenditore', 'Ingegnere', 'Medico',
    'Avvocato', 'Professore', 'Commercialista', 'Architetto', 'Dirigente',
    'Operaio', 'Commerciante', 'Artigiano', 'Libero professionista',
    'Funzionario pubblico', 'Militare', 'Pubblico dipendente', 'Consulente',
    'Ricercatore', 'Giornalista', 'Insegnante', 'Infermiere', 'Farmacista',
    'Veterinario', 'Geometra', 'Perito', 'Programmatore', 'Designer',
    'Marketing', 'Venditore', 'Autotrasportatore', 'Agricoltore',
    'Allevatore', 'Pescatore', 'Cuoco', 'Cameriere', 'Parrucchiere',
    'Estetista', 'Meccanico', 'Elettricista', 'Idraulico', 'Falegname',
    'Muratore', 'Tassista', 'Autista', 'Magazziniere', 'Guardia sicurezza',
    'Addetto pulizie', 'Altro',
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private elRef: ElementRef,
  ) {}

  get hasMinLength(): boolean { return this.password.length >= 8; }
  get hasUppercase(): boolean { return /[A-Z]/.test(this.password); }
  get hasLowercase(): boolean { return /[a-z]/.test(this.password); }
  get hasNumber(): boolean { return /\d/.test(this.password); }
  get hasSpecialChar(): boolean { return /[^a-zA-Z0-9]/.test(this.password); }

  onPasswordInput(): void {
    if (!this.password) { this.passwordStrength.set(''); return; }
    let score = 0;
    if (this.hasMinLength) score++;
    if (this.hasUppercase) score++;
    if (this.hasLowercase) score++;
    if (this.hasNumber) score++;
    if (this.hasSpecialChar) score++;
    if (score >= 5) this.passwordStrength.set('strong');
    else if (score >= 3) this.passwordStrength.set('medium');
    else this.passwordStrength.set('weak');
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elRef.nativeElement.querySelector('.autocomplete-wrapper')?.contains(target)) {
      this.showCitySuggestions = false;
      this.showResidenceSuggestions = false;
    }
  }

  onCitySearchInput(): void {
    const q = this.birthPlaceSearch.trim();
    if (q.length < 1) {
      this.filteredCities = [];
      this.showCitySuggestions = false;
      return;
    }
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.http.get<ComuneDto[]>(`http://localhost:8081/api/v1/comuni?search=${encodeURIComponent(q)}`)
        .subscribe({
          next: (results) => {
            this.filteredCities = results;
            this.showCitySuggestions = results.length > 0;
          },
          error: () => {
            this.filteredCities = [];
            this.showCitySuggestions = false;
          },
        });
    }, 100);
  }

  selectCity(city: ComuneDto): void {
    this.birthPlace = city.nome;
    this.birthProvince = city.provincia;
    this.birthCatastalCode = city.codiceCatastale;
    this.birthPlaceSearch = city.nome + ' (' + city.provincia + ')';
    this.showCitySuggestions = false;
    this.filteredCities = [];
  }

  onCitySearchFocus(): void {
    if (this.filteredCities.length > 0) this.showCitySuggestions = true;
  }

  clearCitySearch(): void {
    this.birthPlaceSearch = '';
    this.birthPlace = '';
    this.birthProvince = '';
    this.birthCatastalCode = '';
    this.filteredCities = [];
    this.showCitySuggestions = false;
  }

  onResidenceSearchInput(): void {
    const q = this.residenceSearch.trim();
    if (q.length < 2) {
      this.filteredAddresses = [];
      this.showResidenceSuggestions = false;
      return;
    }
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&countrycode=IT`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((res: any) => {
        this.filteredAddresses = (res.features || []).map((f: PhotonFeature) => {
          const p = f.properties;
          return {
            street: p.street || p.name || '',
            housenumber: p.housenumber || '',
            postcode: p.postcode || '',
            city: p.city || '',
            country: p.country || 'Italia',
          };
        });
        this.showResidenceSuggestions = this.filteredAddresses.length > 0;
      })
      .catch(() => {
        this.filteredAddresses = [];
        this.showResidenceSuggestions = false;
      });
  }

  selectAddress(addr: AddressSuggestion): void {
    this.residence = addr.street || '';
    this.residenceSearch = addr.street || '';
    this.houseNumber = addr.housenumber || '';
    this.postcode = addr.postcode || '';
    this.showResidenceSuggestions = false;
    this.filteredAddresses = [];
  }

  onResidenceSearchFocus(): void {
    if (this.filteredAddresses.length > 0) this.showResidenceSuggestions = true;
  }

  clearResidenceSearch(): void {
    this.residenceSearch = '';
    this.residence = '';
    this.houseNumber = '';
    this.postcode = '';
    this.filteredAddresses = [];
    this.showResidenceSuggestions = false;
  }

  generateFiscalCode(): void {
    const code = this.computeFiscalCode();
    if (code) this.fiscalCode = code;
  }

  private computeFiscalCode(): string {
    if (!this.lastName) { this.focusField('lastName'); return ''; }
    if (!this.firstName) { this.focusField('firstName'); return ''; }
    if (!this.birthDate) { this.focusField('birthDate'); return ''; }
    if (!this.birthPlace) { this.focusField('birthPlaceSearch'); return ''; }
    if (!this.birthProvince || !this.birthCatastalCode) { this.focusField('birthPlaceSearch'); return ''; }
    if (!this.gender) { this.focusField('gender'); return ''; }

    const surnamePart = this.surnameCode(this.lastName);
    const namePart = this.nameCode(this.firstName);
    const yearPart = this.birthYearCode(this.birthDate);
    const monthPart = this.birthMonthCode(this.birthDate);
    const dayGenderPart = this.birthDayGenderCode(this.birthDate);
    const municipalityPart = this.birthCatastalCode;

    const partial = surnamePart + namePart + yearPart + monthPart + dayGenderPart + municipalityPart;
    const cin = this.computeCIN(partial);
    return partial + cin;
  }

  private extractConsonants(s: string): string {
    return s.replace(/[^bcdfghjlmnpqrstvz]/gi, '').toUpperCase();
  }

  private extractVowels(s: string): string {
    return s.replace(/[^aeiou]/gi, '').toUpperCase();
  }

  private surnameCode(name: string): string {
    const c = this.extractConsonants(name);
    const v = this.extractVowels(name);
    return (c + v + 'XXX').substring(0, 3);
  }

  private nameCode(name: string): string {
    const c = this.extractConsonants(name);
    const v = this.extractVowels(name);
    if (c.length > 3) return (c[0] + c[2] + c[3]).substring(0, 3);
    return (c + v + 'XXX').substring(0, 3);
  }

  private birthYearCode(dateStr: string): string {
    return new Date(dateStr).getFullYear().toString().slice(-2);
  }

  private birthMonthCode(dateStr: string): string {
    const month = new Date(dateStr).getMonth() + 1;
    return 'ABCDEHLMPRST'[month - 1];
  }

  private birthDayGenderCode(dateStr: string): string {
    const day = new Date(dateStr).getDate();
    const adjustedDay = this.gender === 'F' ? day + 40 : day;
    return adjustedDay.toString().padStart(2, '0');
  }

  private computeCIN(partial: string): string {
    const oddMap: Record<string, number> = {
      '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17,
      '8': 19, '9': 21, 'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13,
      'G': 15, 'H': 17, 'I': 19, 'J': 21, 'K': 2, 'L': 4, 'M': 18, 'N': 20,
      'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14, 'U': 16, 'V': 10,
      'W': 22, 'X': 25, 'Y': 24, 'Z': 23,
    };
    const evenMap: Record<string, number> = {
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
      '8': 8, '9': 9, 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5,
      'G': 6, 'H': 7, 'I': 8, 'J': 9, 'K': 10, 'L': 11, 'M': 12, 'N': 13,
      'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19, 'U': 20, 'V': 21,
      'W': 22, 'X': 23, 'Y': 24, 'Z': 25,
    };
    let sum = 0;
    for (let i = 0; i < partial.length; i++) {
      const ch = partial[i];
      sum += (i % 2 === 0) ? (oddMap[ch] ?? 0) : (evenMap[ch] ?? 0);
    }
    return String.fromCharCode(65 + (sum % 26));
  }

  onSubmit(): void {
    this.error.set('');

    const invalidField = this.findFirstInvalidField();
    if (invalidField) { this.focusField(invalidField); return; }

    if (this.password !== this.confirmPassword) { this.focusField('confirmPassword'); return; }

    if (!this.hasMinLength || !this.hasUppercase || !this.hasLowercase || !this.hasNumber || !this.hasSpecialChar) {
      this.focusField('password'); return;
    }

    const birthDateObj = new Date(this.birthDate);
    const age = Math.floor((Date.now() - birthDateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) { this.focusField('birthDate'); return; }

    this.loading.set(true);

    const street = this.residence || '';
    const num = this.houseNumber || '';
    const cap = this.postcode || '';
    const fullResidence = [street, num, cap].filter(Boolean).join(', ');

    this.authService.register({
      firstName: this.capitalizeWords(this.firstName),
      lastName: this.capitalizeWords(this.lastName),
      birthDate: this.birthDate,
      email: this.email,
      password: this.password,
      profession: this.profession,
      gender: this.gender,
      fiscalCode: this.fiscalCode.toUpperCase(),
      phone: '+39' + this.phone.replace(/[\s\-.]/g, ''),
      residence: fullResidence,
      birthPlace: this.birthPlace,
      birthProvince: this.birthProvince.toUpperCase(),
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.showSuccessModal.set(true);
        document.body.style.overflow = 'hidden';
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }

  private findFirstInvalidField(): string | null {
    if (!this.firstName || !/^[a-zA-Z\u00C0-\u00FF' ]+$/.test(this.firstName)) return 'firstName';
    if (!this.lastName || !/^[a-zA-Z\u00C0-\u00FF' ]+$/.test(this.lastName)) return 'lastName';
    if (!this.birthDate) return 'birthDate';
    if (!this.gender) return 'gender';
    if (!this.birthPlace) return 'birthPlaceSearch';
    if (!this.fiscalCode || this.fiscalCode.length !== 16) return 'fiscalCode';
    const phoneClean = this.phone.replace(/[\s\-.]/g, '');
    if (!phoneClean || !/^[03]\d{8,11}$/.test(phoneClean)) return 'phone';
    if (!this.profession) return 'profession';
    if (!this.residence) return 'residenceSearch';
    if (!this.email) return 'email';
    if (!this.password) return 'password';
    return null;
  }

  private focusField(fieldId: string): void {
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        el.classList.add('field-invalid');
        el.focus();
        el.addEventListener('input', () => el.classList.remove('field-invalid'), { once: true });
        el.addEventListener('change', () => el.classList.remove('field-invalid'), { once: true });
      }, 350);
    }
  }

  private capitalizeWords(value: string): string {
    return value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  goToLogin(): void {
    document.body.style.overflow = '';
    this.router.navigate(['/login']);
  }
}
