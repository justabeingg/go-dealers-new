# OPTIMIZATION BACKUP - RESTORATION GUIDE

## What's in This Folder?

This folder contains the **profile caching optimization** that we attempted but had to revert because it broke the profile display.

### Files Backed Up:
1. **storage.ts.txt** - AsyncStorage helper functions
2. **AuthContext.tsx.txt** - Global profile state context
3. **_layout.tsx.txt** - App wrapper with AuthProvider

## What These Files Do:

**Goal:** Stop re-fetching profile data every time user switches tabs.

**How it works:**
- Loads profile ONCE on app start
- Saves it in AsyncStorage (local cache)
- Tab switching uses cached data (instant!)
- Manual refresh when needed

## Why We Removed Them:

When we implemented this optimization, the **profile tab stopped working** - it wouldn't show the profile or posts. So we reverted to the old working code.

## How to Restore (When Ready to Try Again):

### Step 1: Copy Files Back
```bash
# From BACKUPS folder, copy to original locations:

# 1. Storage helper
copy "storage.ts.txt" to "lib/storage.ts"

# 2. Auth context
copy "AuthContext.tsx.txt" to "contexts/AuthContext.tsx"

# 3. App layout
copy "_layout.tsx.txt" to "app/_layout.tsx"
```

### Step 2: Update Profile Tab
You'll need to modify `app/(tabs)/profile.tsx`:

**Change this:**
```typescript
const [profile, setProfile] = useState<any>(null)

const fetchProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  // ... fetch profile from database
}
```

**To this:**
```typescript
import { useAuth } from '../../contexts/AuthContext'

const { profile, refreshProfile } = useAuth()

// Remove fetchProfile function
// Remove useFocusEffect that calls fetchProfile
```

### Step 3: Test Thoroughly
- [ ] App starts without errors
- [ ] Profile displays correctly
- [ ] Posts load
- [ ] Tab switching is faster
- [ ] Edit profile updates cache

## Known Issues to Fix:

1. **Profile not showing** - The AuthContext might not be providing profile correctly
2. **Timing issue** - Profile might load too late
3. **Cache not updating** - After editing profile, cache might not refresh

## Recommendations for Next Attempt:

1. Test with console.log to see when profile loads
2. Add loading states while profile is being fetched
3. Maybe use a simpler caching approach (just cache, don't use Context)
4. Test on real device, not just simulator

## When to Try Again:

**After all features are complete and working!**
- Wait until app is stable
- Do this optimization right before building APK
- Have time to debug properly

---

**For now: Keep these files safe, but don't use them.**
