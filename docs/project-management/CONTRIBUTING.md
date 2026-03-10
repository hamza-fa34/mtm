# Conventions de Contribution

## 1) Principe de base
- 1 sujet = 1 ticket = 1 PR
- Pas de refactor global non demande
- Toujours proteger les flux critiques: POS, KDS, EndOfDay, Data Management

## 2) Format obligatoire d'une proposition
Chaque changement doit contenir:
- Objectif
- Fichiers impactes
- Changements
- Risques
- Tests manuels
- Plan de rollback

## 3) Regles de code
- TypeScript strict, eviter `any`
- Nommage explicite et coherent
- Pas de logique critique dupliquee si utilitaire commun existe
- Garder les changements petits et lisibles

## 4) Regles de securite donnees
- Toute operation destructive doit etre protegee (role + confirmation)
- Toute migration de format doit prevoir fallback ou script de migration
- Les cles de donnees locales doivent passer par les constantes centralisees

## 5) Checklist PR (obligatoire avant merge)
- [ ] Le scope du ticket est respecte
- [ ] Les risques sont identifies
- [ ] Les tests manuels sont documentes
- [ ] `npm run quality:ci` passe
- [ ] Aucun impact non prevu sur POS/KDS/EndOfDay
- [ ] Les docs impactees sont mises a jour

## 6) Checklist reviewer
- [ ] Le changement est coherent avec `AGENTS.md`
- [ ] La solution est incrementale et reversible
- [ ] Les erreurs utilisateur sont gerees
- [ ] Les permissions sensibles sont respectees
- [ ] Le rollback est praticable
