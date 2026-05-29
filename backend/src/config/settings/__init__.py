import os

from ._utils import load_env_vars


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
ALWAYS_CREATE_ENV = os.getenv("ALWAYS_CREATE_ENV", "False").lower() == "true"

ENV_PATH = os.path.join(ROOT_DIR, ".env")
load_env_vars(
    ENV_PATH,
    always_create_env=ALWAYS_CREATE_ENV,
)


from .common import *
from .cloud_settings import get_storage_settings
from .currency_settings import *
from .database_settings import *
from .drf_settings import *
from .email_settings import *
from .logging_settings import *
from .oauth_settings import *
from .payment_gateway_settings import *
from .redis_settings import *


globals().update(get_storage_settings())