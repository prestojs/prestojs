import rules

from xenopus_frog.models import AdminProfile


def is_admin(user, obj=None):
    return not user.is_anonymous and isinstance(user.get_profile(), AdminProfile)


def is_superuser(user, obj=None):
    return not user.is_anonymous and user.is_superuser


def can_hijack(hijacker, hijacked):
    if hijacker.is_superuser:
        return True
    if is_admin(hijacker) and not is_admin(hijacked):
        return True
    return False


rules.add_perm("is_admin", is_admin)
rules.add_perm("is_superuser", is_superuser)
rules.add_perm("can_hijack", can_hijack)
