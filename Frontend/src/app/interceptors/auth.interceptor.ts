// src/app/interceptors/auth.interceptor.ts  (ou le fichier où il est placé)
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // si pas de token => passe la requête telle quelle
  if (!token) {
    // debug utile en dev
    //console.debug('[AuthInterceptor] no token found, skipping Authorization header');
    return next(req);
  }

  // Conditions pour considérer que la requête cible notre API :
  //  - URL absolue commencant par environment.apiUrl
  //  - ou URL relative qui commence par '/api'
  //  - ou si l'origin cible la même host (optionnel)
  const apiBase = (environment.apiUrl || '').replace(/\/$/, '');
  const shouldAttach =
    (apiBase && req.url.startsWith(apiBase)) ||
    req.url.startsWith('/api') ||
    req.url.includes('/api/'); // fallback

  if (shouldAttach) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    // debug utile :
    // console.debug('[AuthInterceptor] attaching Authorization header to', req.url);
    return next(authReq);
  }

  return next(req);
};
