# Contributing to Quotevoice

Thank you for your interest in contributing to Quotevoice! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Git
- A code editor (VS Code recommended)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/quotevoice.git
   cd quotevoice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Create a branch for your feature**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📁 Project Structure

```
Quotevoice/
├── electron/              # Electron main process
│   ├── main.ts           # App entry, window creation
│   ├── preload.ts        # Context bridge (IPC exposure)
│   ├── db.ts             # Database service layer
│   └── ipcHandlers.ts    # IPC request handlers
│
├── src/                   # React renderer process
│   ├── App.tsx           # Main app with routing
│   ├── main.tsx          # React entry point
│   ├── index.css         # Tailwind CSS imports
│   ├── types.d.ts        # TypeScript declarations
│   └── components/       # React components
│       ├── InvoiceEditor.tsx
│       ├── Clients.tsx
│       └── Settings.tsx
│
├── public/                # Static assets
├── resources/             # Build resources (icons)
├── dist/                  # Compiled React
├── dist-electron/         # Compiled Electron
└── release/               # Packaged installers
```

## 🔧 Development Guidelines

### Code Style

- **TypeScript** - Use strict typing, avoid `any` where possible
- **React** - Functional components with hooks
- **CSS** - Tailwind utility classes
- **Naming** - PascalCase for components, camelCase for functions

### Component Structure

```tsx
// Example component structure
import { useState, useEffect } from 'react';

type Props = {
    title: string;
    onSave: (data: any) => void;
};

export default function MyComponent({ title, onSave }: Props) {
    const [state, setState] = useState('');
    
    useEffect(() => {
        // Side effects
    }, []);
    
    const handleAction = () => {
        // Handler logic
    };
    
    return (
        <div className="p-4">
            {/* JSX */}
        </div>
    );
}
```

### IPC Communication Pattern

When adding new features that require main process access:

1. **Add database method** in `electron/db.ts`:
   ```typescript
   export const dbService = {
       myNewMethod: (params: any) => {
           // Implementation
           saveDatabase();
           return result;
       }
   };
   ```

2. **Add IPC handler** in `electron/ipcHandlers.ts`:
   ```typescript
   ipcMain.handle('my-new-method', async (_event, params) => {
       return dbService.myNewMethod(params);
   });
   ```

3. **Expose in preload** in `electron/preload.ts`:
   ```typescript
   contextBridge.exposeInMainWorld('api', {
       myNewMethod: (params: any) => ipcRenderer.invoke('my-new-method', params),
   });
   ```

4. **Add TypeScript type** in `src/types.d.ts`:
   ```typescript
   export interface IApi {
       myNewMethod: (params: any) => Promise<any>;
   }
   ```

5. **Use in React** component:
   ```typescript
   const result = await window.api.myNewMethod(params);
   ```

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR, test these scenarios:

- [ ] Settings save and persist after restart
- [ ] Logo uploads and displays on PDF
- [ ] Client creation and search works
- [ ] Invoice saves with correct number
- [ ] PDF downloads successfully
- [ ] All navigation links work
- [ ] No console errors

### Building

```bash
# Type check
npx tsc --noEmit

# Build all
npm run build

# Test installer
# Run the generated .exe in release/
```

## 📝 Commit Messages

Use conventional commits:

```
feat: add email invoice feature
fix: correct tax calculation rounding
docs: update README installation section
style: format code with prettier
refactor: simplify invoice creation logic
```

## 🔀 Pull Request Process

1. **Update documentation** if adding features
2. **Test thoroughly** on Windows
3. **Keep PRs focused** - one feature per PR
4. **Write clear description** of changes
5. **Reference issues** if applicable

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing Done
- [ ] Manual testing completed
- [ ] Build succeeds
- [ ] No new console errors

## Screenshots (if applicable)
```

## 🐛 Bug Reports

When reporting bugs, include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots** if applicable
5. **System info** (Windows version, Node version)

## 💡 Feature Requests

For new features:

1. **Check existing issues** first
2. **Describe the use case**
3. **Propose a solution** if you have one
4. **Consider impact** on existing features

## 📋 Roadmap Items

Current priorities for contributions:

### High Priority
- [ ] Edit existing invoices
- [ ] Mark invoices as Paid/Sent
- [ ] Invoice list view with filters

### Medium Priority
- [ ] Email invoices to clients
- [ ] Duplicate invoice as template
- [ ] Monthly revenue reports

### Low Priority
- [ ] Dark mode theme
- [ ] Multiple languages
- [ ] Cloud backup

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Quotevoice! 🙏
